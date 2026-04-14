<?php

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    gp_send_json(405, ['message' => 'Méthode non autorisée']);
}

$token = gp_get_bearer_token();
if ($token === '') {
    gp_send_json(401, ['message' => 'Token manquant']);
}

try {
    $payload = gp_jwt_verify($token, $config['jwt']);
    $idUser = (int)($payload['sub'] ?? 0);

    $pdo = gp_pdo($config);
    $stmt = $pdo->prepare('SELECT id_user, nomuser, prenomuser, email, statutuser, pdpuser, inscriptionuser FROM utilisateur WHERE id_user = :id LIMIT 1');
    $stmt->execute([':id' => $idUser]);
    $user = $stmt->fetch();

    if (!$user) {
        gp_send_json(404, ['message' => 'Utilisateur introuvable']);
    }

    $role = gp_resolve_user_role($pdo, $idUser);
    if ($role === null) {
        gp_send_json(403, ['message' => 'Compte sans rôle associé']);
    }

    gp_send_json(200, [
        'user' => [
            'idUser' => (int)$user['id_user'],
            'nomUser' => (string)($user['nomuser'] ?? ''),
            'prenomUser' => (string)($user['prenomuser'] ?? ''),
            'email' => (string)($user['email'] ?? ''),
            'statutUser' => (string)($user['statutuser'] ?? ''),
            'pdpUser' => $user['pdpuser'] ?? null,
            'inscriptionUser' => $user['inscriptionuser'] ?? null,
            'role' => $role,
        ],
    ]);
} catch (Throwable $e) {
    $msg = (!empty($config['debug'])) ? ($e->getMessage() ?: 'Token invalide') : 'Token invalide';
    gp_send_json(401, ['message' => $msg]);
}
