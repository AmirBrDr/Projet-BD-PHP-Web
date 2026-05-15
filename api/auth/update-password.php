<?php

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

// Endpoint protégé: modification du mot de passe utilisateur
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    gp_send_json(405, ['message' => 'Méthode non autorisée']);
}

$token = gp_get_bearer_token();
if ($token === '') {
    gp_send_json(401, ['message' => 'Token manquant']);
}

try {
    $payload = gp_jwt_verify($token, $config['jwt']);
    $userId  = (int) ($payload['sub'] ?? 0);
    if ($userId <= 0) {
        gp_send_json(401, ['message' => 'Token invalide']);
    }
} catch (Throwable $e) {
    gp_send_json(401, ['message' => 'Token invalide']);
}

$body            = gp_read_json_body();
$currentPassword = (string) ($body['current_password'] ?? '');
$newPassword     = (string) ($body['new_password']     ?? '');

if (trim($currentPassword) === '' || trim($newPassword) === '') {
    gp_send_json(400, ['message' => 'Mot de passe actuel et nouveau requis']);
}

if (strlen($newPassword) < 8) {
    gp_send_json(400, ['message' => 'Le nouveau mot de passe doit contenir au moins 8 caractères']);
}

$pdo = gp_pdo($config);

$stmt = $pdo->prepare("SELECT mdp FROM Utilisateur WHERE Id_User = :id LIMIT 1");
$stmt->execute([':id' => $userId]);
$user = $stmt->fetch();

if (!$user) {
    gp_send_json(404, ['message' => 'Utilisateur introuvable']);
}

$storedHash = (string) $user['mdp'];
$verified = password_verify($currentPassword, $storedHash);

// Compatibilité: accepte les anciens hashes en clair si présents
if (!$verified) {
    $info = password_get_info($storedHash);
    if (($info['algo'] ?? 0) === 0 && hash_equals($storedHash, $currentPassword)) {
        $verified = true;
    }
}

if (!$verified) {
    gp_send_json(401, ['message' => 'Mot de passe actuel incorrect']);
}

// Hash moderne pour le stockage en base
$hashed = password_hash($newPassword, PASSWORD_BCRYPT);

$stmt = $pdo->prepare("UPDATE Utilisateur SET mdp = :mdp WHERE Id_User = :id");
$stmt->execute([':mdp' => $hashed, ':id' => $userId]);

gp_send_json(200, ['message' => 'Mot de passe mis à jour']);
