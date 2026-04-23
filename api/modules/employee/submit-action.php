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

$body = gp_read_json_body();
$defiId   = (int) ($body['defi_id']   ?? 0);
$actionId = (int) ($body['action_id'] ?? 0);
$preuve   = trim((string) ($body['preuve'] ?? ''));

if ($defiId <= 0 || $actionId <= 0) {
    gp_send_json(400, ['message' => 'defi_id et action_id requis']);
}
if ($preuve === '') {
    gp_send_json(400, ['message' => 'Une preuve est requise']);
}

$pdo    = gp_pdo($config);
$userId = (int) $claims['sub'];

// Vérifier que l'action appartient bien au défi
$stmt = $pdo->prepare("
    SELECT 1 FROM Faire_partie WHERE Id_defi = :defi AND Id_actions = :action
");
$stmt->execute([':defi' => $defiId, ':action' => $actionId]);
if (!$stmt->fetch()) {
    gp_send_json(400, ['message' => 'Cette action n\'appartient pas à ce défi']);
}

// Vérifier que l'employé n'a pas déjà validé cette action pour ce défi
$stmt = $pdo->prepare("
    SELECT 1 FROM Valider WHERE Id_defi = :defi AND Id_actions = :action AND Id_Employe = :emp
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
