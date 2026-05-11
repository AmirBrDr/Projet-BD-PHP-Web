<?php

declare(strict_types=1);

require_once __DIR__ . '/../../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    gp_send_json(405, ['message' => 'Méthode non autorisée']);
}

$token = gp_get_bearer_token();
if ($token === '') {
    gp_send_json(401, ['message' => 'Token manquant']);
}

try {
    $claims = gp_jwt_verify($token, $config['jwt']);
} catch (Throwable $e) {
    gp_send_json(401, ['message' => 'Token invalide']);
}

if (gp_normalize_role($claims['role'] ?? '') !== 'employe') {
    gp_send_json(403, ['message' => 'Accès refusé']);
}

function gp_ai_parse_decision(string $text): array
{
    $clean = trim($text);
    if ($clean === '') {
        return ['decision' => 'needs_review', 'reason' => 'Reponse vide'];
    }

    $clean = preg_replace('/^```[a-z]*\n?/i', '', $clean);
    $clean = preg_replace('/```$/', '', $clean);

    $decoded = json_decode($clean, true);
    if (is_array($decoded)) {
        $decision = strtolower(trim((string)($decoded['decision'] ?? '')));
        $reason = trim((string)($decoded['reason'] ?? ''));
        if (in_array($decision, ['approved', 'needs_review'], true)) {
            return ['decision' => $decision, 'reason' => $reason];
        }
    }

    $lower = strtolower($clean);
    if (str_contains($lower, 'approved') || str_contains($lower, 'valide')) {
        return ['decision' => 'approved', 'reason' => ''];
    }

    return ['decision' => 'needs_review', 'reason' => ''];
}

function gp_ai_verify_submission(array $config, string $comment, ?string $imagePath, ?string $imageMime): array
{
    $endpoint = (string)($config['ai']['endpoint'] ?? '');
    $apiKey = (string)($config['ai']['key'] ?? '');
    $model = (string)($config['ai']['model'] ?? '');

    if ($endpoint === '' || $apiKey === '' || $model === '') {
        return ['decision' => 'needs_review', 'reason' => "IA non configuree"]; 
    }

    $instruction = "Tu es un verificateur de preuves d'actions. Reponds uniquement en JSON valide au format: {\"decision\":\"approved\"|\"needs_review\",\"reason\":\"...\"}. Sois permissif: approuve si une photo est fournie meme avec un commentaire court, ou si le commentaire contient un detail concret (lieu, duree, quantite, action precise). Utilise needs_review seulement si la preuve est clairement insuffisante ou incoherente. Ne retourne rien d'autre.";
    $commentText = trim($comment) !== '' ? "Commentaire employe: " . trim($comment) : "Commentaire employe: (aucun)";

    $userContent = [
        ['type' => 'text', 'text' => $commentText],
    ];

    if ($imagePath && is_file($imagePath)) {
        $binary = file_get_contents($imagePath);
        if ($binary !== false) {
            $mime = $imageMime ?: 'image/jpeg';
            $userContent[] = [
                'type' => 'image_url',
                'image_url' => [
                    'url' => 'data:' . $mime . ';base64,' . base64_encode($binary),
                ],
            ];
        }
    }

    $payload = json_encode([
        'model' => $model,
        'temperature' => 0.2,
        'max_tokens' => 200,
        'messages' => [
            ['role' => 'system', 'content' => $instruction],
            ['role' => 'user', 'content' => $userContent],
        ],
    ]);

    $ch = curl_init($endpoint);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ],
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_TIMEOUT => 20,
    ]);

    $raw = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($raw === false || $httpCode < 200 || $httpCode >= 300) {
        return ['decision' => 'needs_review', 'reason' => 'Erreur IA'];
    }

    $decoded = json_decode($raw, true);
    $text = '';
    if (is_array($decoded)) {
        $text = (string)($decoded['choices'][0]['message']['content'] ?? '');
    }

    $parsed = gp_ai_parse_decision($text);
    if ($parsed['decision'] !== 'approved' && $parsed['decision'] !== 'needs_review') {
        if (preg_match('/\{.*\}/s', $text, $match)) {
            $parsed = gp_ai_parse_decision($match[0]);
        }
    }
    if ($parsed['decision'] !== 'approved' && $parsed['decision'] !== 'needs_review') {
        return ['decision' => 'needs_review', 'reason' => ''];
    }

    return $parsed;
}

$defiId   = (int) ($_POST['defi_id']   ?? 0);
$actionId = (int) ($_POST['action_id'] ?? 0);
$proofText = trim((string) ($_POST['proofText'] ?? ''));

if ($defiId <= 0 || $actionId <= 0) {
    gp_send_json(400, ['message' => 'defi_id et action_id requis']);
}

// Gérer la photo de preuve
$preuve = '';
$file   = $_FILES['preuvePhoto'] ?? null;
$hasPhoto = $file && isset($file['tmp_name']) && $file['error'] === UPLOAD_ERR_OK && $file['size'] > 0;
$detectedMime = '';
$photoPathForAi = null;

if ($hasPhoto) {
    $allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
    $detectedMime = mime_content_type($file['tmp_name']);
    if (!in_array($detectedMime, $allowedMime, true)) {
        gp_send_json(400, ['message' => 'Type de fichier non autorisé (jpeg, png, webp uniquement)']);
    }
    if ($file['size'] > 5 * 1024 * 1024) {
        gp_send_json(400, ['message' => 'Photo trop volumineuse (5 Mo max)']);
    }
    $extMap = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $ext = $extMap[$detectedMime] ?? 'jpg';
    $filename  = 'proof_' . uniqid('', true) . '.' . $ext;
    $uploadDir = __DIR__ . '/../../../public/image/preuves/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    $targetPath = $uploadDir . $filename;
    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        gp_send_json(500, ['message' => "Impossible d'enregistrer la photo"]);
    }
    $preuve = '/image/preuves/' . $filename;
    $photoPathForAi = $targetPath;
} elseif ($proofText !== '') {
    $preuve = $proofText;
} else {
    gp_send_json(400, ['message' => 'Une photo ou un commentaire de preuve est requis']);
}

$pdo    = gp_pdo($config);
gp_ensure_defi_block_table($pdo);
gp_ensure_replies_table($pdo);
$userId = (int) $claims['sub'];

$stmt = $pdo->prepare(
    'SELECT 1
     FROM Defi_Employe_Block
     WHERE Id_defi = :defi_id AND Id_Employe = :employe_id
     LIMIT 1'
);
$stmt->execute([':defi_id' => $defiId, ':employe_id' => $userId]);
if ($stmt->fetch()) {
    gp_send_json(403, ['message' => 'Vous etes bloque pour ce defi']);
}

$stmt = $pdo->prepare("
    SELECT emp.Id_equipe AS equipe_id
    FROM Employe emp
    WHERE emp.Id_Employe = :id
    LIMIT 1
");
$stmt->execute([':id' => $userId]);
$teamRow = $stmt->fetch();
$teamId  = $teamRow ? (int) $teamRow['equipe_id'] : 0;

$stmt = $pdo->prepare("
    SELECT 1
    FROM Faire_partie
    WHERE Id_defi = :defi AND Id_actions = :action
");
$stmt->execute([':defi' => $defiId, ':action' => $actionId]);
if (!$stmt->fetch()) {
    gp_send_json(400, ['message' => "Cette action n'appartient pas à ce défi"]);
}

$stmt = $pdo->prepare("
    SELECT r.ordre, r.Id_thematique, r.mois
    FROM Regroupe r
    WHERE r.Id_defi = :defi
      AND date_trunc('month', r.mois) = date_trunc('month', CURRENT_DATE)
    LIMIT 1
");
$stmt->execute([':defi' => $defiId]);
$challengeRow = $stmt->fetch();
if (!$challengeRow) {
    gp_send_json(404, ['message' => 'Défi introuvable']);
}

if ($teamId > 0) {
    $stmt = $pdo->prepare("
        SELECT COUNT(*) AS nb
        FROM Employe e
        JOIN Utilisateur u ON u.Id_User = e.Id_Employe
        WHERE e.Id_equipe = :team
          AND u.statutUser = 'actif'
    ");
    $stmt->execute([':team' => $teamId]);
    $memberCountRow = $stmt->fetch();
    $memberCount = max(1, (int) ($memberCountRow['nb'] ?? 0));

    $ordre = (int) $challengeRow['ordre'];
    if ($ordre > 1) {
        $stmt = $pdo->prepare("
            SELECT r2.Id_defi
            FROM Regroupe r2
            WHERE r2.Id_thematique = :theme
              AND r2.ordre = :ordre
              AND date_trunc('month', r2.mois) = date_trunc('month', :mois::date)
            LIMIT 1
        ");
        $stmt->execute([
            ':theme' => (int) $challengeRow['id_thematique'],
            ':ordre' => $ordre - 1,
            ':mois' => $challengeRow['mois'],
        ]);
        $previousRow = $stmt->fetch();

        if ($previousRow) {
            $stmt = $pdo->prepare("
                SELECT COUNT(DISTINCT v.Id_Employe) AS nb_valides
                FROM Valider v
                JOIN Employe e ON e.Id_Employe = v.Id_Employe
                JOIN Utilisateur u ON u.Id_User = e.Id_Employe
                WHERE e.Id_equipe = :team
                  AND u.statutUser = 'actif'
                  AND v.Id_defi = :defi
                  AND date_trunc('month', v.mois) = date_trunc('month', :mois::date)
            ");
            $stmt->execute([
                ':team' => $teamId,
                ':defi' => (int) $previousRow['id_defi'],
                ':mois' => $challengeRow['mois'],
            ]);
            $validatedRow   = $stmt->fetch();
            $validatedCount = (int) ($validatedRow['nb_valides'] ?? 0);

            if ($validatedCount < $memberCount) {
                gp_send_json(422, ['message' => 'Votre équipe doit valider le défi précédent avant celui-ci']);
            }
        }
    }
}

$stmt = $pdo->prepare("
    SELECT 1
    FROM Valider
    WHERE Id_defi = :defi AND Id_Employe = :emp
      AND date_trunc('month', mois) = date_trunc('month', :mois::date)
");
$stmt->execute([
    ':defi' => $defiId,
    ':emp'  => $userId,
    ':mois' => $challengeRow['mois'],
]);
if ($stmt->fetch()) {
    gp_send_json(409, ['message' => 'Vous avez déjà validé ce défi ce mois-ci']);
}

$stmt = $pdo->prepare("
    SELECT 1
    FROM Reponse_Defi
    WHERE Id_defi = :defi AND Id_Employe = :emp
      AND statut_reponse = 'pending'
      AND date_trunc('month', date_reponse) = date_trunc('month', CURRENT_TIMESTAMP)
    LIMIT 1
");
$stmt->execute([
    ':defi' => $defiId,
    ':emp'  => $userId,
]);
if ($stmt->fetch()) {
    gp_send_json(409, ['message' => 'Une soumission est déjà en attente pour ce défi']);
}

$aiResult = gp_ai_verify_submission($config, $proofText, $photoPathForAi, $detectedMime);
$aiDecision = $aiResult['decision'] ?? 'needs_review';
$aiReason = trim((string)($aiResult['reason'] ?? ''));

if ($aiDecision === 'approved') {
    $commentaireAi = $aiReason !== '' ? ('IA: ' . $aiReason) : 'Approuve par IA';

    $stmt = $pdo->prepare("
        INSERT INTO Reponse_Defi (Id_defi, Id_actions, Id_Employe, reponse_text, statut_reponse, commentaire_animateur, date_traitement)
        VALUES (:defi, :action, :emp, :reponse, 'approved', :commentaire, CURRENT_TIMESTAMP)
        RETURNING date_reponse
    ");
    $stmt->execute([
        ':defi' => $defiId,
        ':action' => $actionId,
        ':emp' => $userId,
        ':reponse' => $preuve,
        ':commentaire' => $commentaireAi,
    ]);

    $dateReponse = $stmt->fetchColumn();
    $mois = $challengeRow['mois'] ?? date('Y-m-01');
    if ($dateReponse) {
        $mois = $challengeRow['mois'] ?? date('Y-m-01');
    }

    $stmtInsert = $pdo->prepare(
        'INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, mois, preuve)
         VALUES (:defi, :action, :employe, :mois, :preuve)
         ON CONFLICT DO NOTHING'
    );
    $stmtInsert->execute([
        ':defi'    => $defiId,
        ':action'  => $actionId,
        ':employe' => $userId,
        ':mois'    => $mois,
        ':preuve'  => $preuve,
    ]);

    gp_send_json(201, [
        'ai_status' => 'approved',
        'message' => 'Votre validation est verifiee par l\'IA.',
    ]);
}

$stmt = $pdo->prepare("
    INSERT INTO Reponse_Defi (Id_defi, Id_actions, Id_Employe, reponse_text)
    VALUES (:defi, :action, :emp, :reponse)
");
$stmt->execute([
    ':defi' => $defiId,
    ':action' => $actionId,
    ':emp' => $userId,
    ':reponse' => $preuve,
]);

gp_send_json(201, [
    'ai_status' => 'needs_review',
    'message' => "L'IA n'a pas pu verifier votre validation. En attente d'un animateur.",
]);
