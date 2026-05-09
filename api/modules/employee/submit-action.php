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
    if (!move_uploaded_file($file['tmp_name'], $uploadDir . $filename)) {
        gp_send_json(500, ['message' => "Impossible d'enregistrer la photo"]);
    }
    $preuve = '/image/preuves/' . $filename;
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
    WHERE Id_defi = :defi AND Id_actions = :action AND Id_Employe = :emp
      AND date_trunc('month', mois) = date_trunc('month', :mois::date)
");
$stmt->execute([
    ':defi'   => $defiId,
    ':action' => $actionId,
    ':emp'    => $userId,
    ':mois'   => $challengeRow['mois'],
]);
if ($stmt->fetch()) {
    gp_send_json(409, ['message' => 'Vous avez déjà validé cette action']);
}

$stmt = $pdo->prepare("
    SELECT 1
    FROM Reponse_Defi
    WHERE Id_defi = :defi AND Id_actions = :action AND Id_Employe = :emp
      AND statut_reponse = 'pending'
      AND date_trunc('month', date_reponse) = date_trunc('month', CURRENT_TIMESTAMP)
    LIMIT 1
");
$stmt->execute([
    ':defi' => $defiId,
    ':action' => $actionId,
    ':emp' => $userId,
]);
if ($stmt->fetch()) {
    gp_send_json(409, ['message' => 'Une soumission est déjà en attente pour cette action']);
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

gp_send_json(201, ['message' => 'Soumission envoyée pour validation']);
