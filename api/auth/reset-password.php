<?php

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    gp_send_json(405, ['message' => 'Méthode non autorisée']);
}

$body = gp_read_json_body();
$token = trim((string)($body['token'] ?? ''));
$password = (string)($body['password'] ?? '');

if ($token === '' || $password === '') {
    gp_send_json(400, ['message' => 'Token et mot de passe requis']);
}

if (strlen($password) < 6) {
    gp_send_json(400, ['message' => 'Mot de passe trop court']);
}

try {
    $payload = gp_password_reset_verify($token, $config['jwt']);
    $idUser = (int)($payload['sub'] ?? 0);
    $email = (string)($payload['email'] ?? '');

    if ($idUser <= 0 || $email === '') {
        gp_send_json(400, ['message' => 'Token de réinitialisation invalide']);
    }

    $pdo = gp_pdo($config);
    $stmt = $pdo->prepare('SELECT id_user, email FROM utilisateur WHERE id_user = :id AND LOWER(email) = LOWER(:email) LIMIT 1');
    $stmt->execute([
        ':id' => $idUser,
        ':email' => $email,
    ]);
    $user = $stmt->fetch();

    if (!$user) {
        gp_send_json(404, ['message' => 'Utilisateur introuvable']);
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('UPDATE utilisateur SET mdp = :mdp WHERE id_user = :id');
    $stmt->execute([
        ':mdp' => $hash,
        ':id' => $idUser,
    ]);

    gp_send_json(200, ['message' => 'Mot de passe mis à jour avec succès']);
} catch (Throwable $e) {
    $msg = (!empty($config['debug'])) ? ($e->getMessage() ?: 'Erreur serveur') : 'Erreur serveur';
    gp_send_json(500, ['message' => $msg]);
}