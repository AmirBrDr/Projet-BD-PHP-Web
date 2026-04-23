<?php

declare(strict_types=1);

require_once __DIR__ . '/../../../bootstrap.php';

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

$body    = gp_read_json_body();
$defiId  = (int) ($body['defi_id'] ?? 0);
$message = trim((string) ($body['message'] ?? ''));

if ($defiId <= 0) {
    gp_send_json(400, ['message' => 'defi_id requis']);
}
if ($message === '') {
    gp_send_json(400, ['message' => 'Le message ne peut pas être vide']);
}
if (mb_strlen($message) > 500) {
    gp_send_json(400, ['message' => 'Message trop long (500 caractères max)']);
}

$pdo    = gp_pdo($config);
$userId = (int) $claims['sub'];

// Trouver ou créer le forum du défi
$stmt = $pdo->prepare("SELECT Id_forum FROM Forum WHERE Id_defi = :id LIMIT 1");
$stmt->execute([':id' => $defiId]);
$forumRow = $stmt->fetch();

if (!$forumRow) {
    // Récupérer le nom du défi pour nommer le forum
    $stmt = $pdo->prepare("SELECT nomDefi FROM Defi WHERE Id_defi = :id");
    $stmt->execute([':id' => $defiId]);
    $defiRow = $stmt->fetch();
    if (!$defiRow) {
        gp_send_json(404, ['message' => 'Défi introuvable']);
    }

    $stmt = $pdo->prepare("
        INSERT INTO Forum (nomForum, Id_defi) VALUES (:nom, :defi) RETURNING Id_forum
    ");
    $stmt->execute([':nom' => 'Forum - ' . $defiRow['nomdefi'], ':defi' => $defiId]);
    $forumId = (int) $stmt->fetchColumn();
} else {
    $forumId = (int) $forumRow['id_forum'];
}

$stmt = $pdo->prepare("
    INSERT INTO Message (contenuMessage, Id_Employe, Id_forum) VALUES (:msg, :emp, :forum)
");
$stmt->execute([':msg' => $message, ':emp' => $userId, ':forum' => $forumId]);

gp_send_json(201, ['message' => 'Message publié']);
