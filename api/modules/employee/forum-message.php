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

$body    = gp_read_json_body();
$defiId  = (int) ($body['defi_id'] ?? 0);
$message = trim((string) ($body['message'] ?? ''));

if ($defiId <= 0) {
    gp_send_json(400, ['message' => 'defi_id requis']);
}
// Validation simple de contenu (anti-spam basique)
if ($message === '') {
    gp_send_json(400, ['message' => 'Le message ne peut pas être vide']);
}
if (strlen($message) > 500) {
    gp_send_json(400, ['message' => 'Message trop long (500 caractères max)']);
}

$pdo    = gp_pdo($config);
gp_ensure_defi_block_table($pdo);
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

// Trouver ou creer le forum du defi pour le mois courant
$stmt = $pdo->prepare("
    SELECT Id_forum FROM Forum
    WHERE Id_defi = :id AND date_trunc('month', mois) = date_trunc('month', CURRENT_DATE)
    LIMIT 1
");
$stmt->execute([':id' => $defiId]);
$forumRow = $stmt->fetch();

if (!$forumRow) {
    // Recuperer le nom du defi pour nommer le forum
    $stmt = $pdo->prepare("SELECT nomDefi FROM Defi WHERE Id_defi = :id");
    $stmt->execute([':id' => $defiId]);
    $defiRow = $stmt->fetch();
    if (!$defiRow) {
        gp_send_json(404, ['message' => 'Défi introuvable']);
    }

    $stmt = $pdo->prepare("
        INSERT INTO Forum (nomForum, Id_defi, mois)
        VALUES (:nom, :defi, date_trunc('month', CURRENT_DATE)::DATE)
        RETURNING Id_forum
    ");
    $stmt->execute([':nom' => 'Forum - ' . $defiRow['nomdefi'], ':defi' => $defiId]);
    $forumId = (int) $stmt->fetchColumn();
} else {
    $forumId = (int) $forumRow['id_forum'];
}

// Enregistrer le message dans le forum courant
$stmt = $pdo->prepare("
    INSERT INTO Message (contenuMessage, Id_Employe, Id_forum, dateMessage) VALUES (:msg, :emp, :forum, :date)
");
$stmt->execute([
    ':msg'   => $message,
    ':emp'   => $userId,
    ':forum' => $forumId,
    ':date'  => date('Y-m-d H:i:s'),
]);

gp_send_json(201, ['message' => 'Message publié']);
