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
$userId = (int) $claims['sub'];

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
    SELECT r.ordre, r.Id_thematique
    FROM Regroupe r
    WHERE r.Id_defi = :defi
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
            LIMIT 1
        ");
        $stmt->execute([
            ':theme' => (int) $challengeRow['id_thematique'],
            ':ordre' => $ordre - 1,
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
            ");
            $stmt->execute([
                ':team' => $teamId,
                ':defi' => (int) $previousRow['id_defi'],
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
");
$stmt->execute([':defi' => $defiId, ':action' => $actionId, ':emp' => $userId]);
if ($stmt->fetch()) {
    gp_send_json(409, ['message' => 'Vous avez déjà validé cette action']);
}

try {
    $stmt = $pdo->prepare("
        INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, preuve)
        VALUES (:defi, :action, :emp, :preuve)
    ");
    $stmt->execute([
        ':defi'   => $defiId,
        ':action' => $actionId,
        ':emp'    => $userId,
        ':preuve' => $preuve,
    ]);
} catch (PDOException $e) {
    $msg = $e->getMessage();
    if (str_contains($msg, 'ordre')) {
        gp_send_json(422, ['message' => 'Vous devez valider le défi précédent avant celui-ci']);
    }
    gp_send_json(500, ['message' => 'Erreur lors de la validation']);
}

gp_send_json(201, ['message' => 'Action validée avec succès']);
