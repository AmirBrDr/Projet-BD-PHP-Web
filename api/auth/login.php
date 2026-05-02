<?php

// Fichier: api/auth/login.php - API et logique serveur.

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

// Vérifier que la méthode HTTP est POST
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    gp_send_json(405, ['message' => 'Méthode non autorisée']);
}

// Récupérer et valider les identifiants
$body = gp_read_json_body();

$email = trim((string)($body['email'] ?? ''));
$mdp = (string)($body['mdp'] ?? '');

if ($email === '' || $mdp === '') {
    gp_send_json(400, ['message' => 'Email et mot de passe requis']);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    gp_send_json(400, ['message' => 'Email invalide']);
}

// Vérifier les identifiants en base de données et générer un token JWT
try {
    $pdo = gp_pdo($config);

    $stmt = $pdo->prepare('SELECT id_user, nomuser, prenomuser, email, statutuser, pdpuser, mdp FROM utilisateur WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();

    // Valider le mot de passe
    if (!$user || !isset($user['mdp']) || !password_verify($mdp, (string)$user['mdp'])) {
        gp_send_json(401, ['message' => 'Identifiants invalides']);
    }

    // Récupérer le rôle de l'utilisateur
    $idUser = (int)$user['id_user'];
    $statutUser = (string)($user['statutuser'] ?? '');
    $role = gp_resolve_user_role($pdo, $idUser);

    if ($role === null) {
        gp_send_json(403, ['message' => 'Compte sans rôle associé']);
    }

    // Mettre à jour la date de dernière connexion
    $stmt = $pdo->prepare('UPDATE utilisateur SET derniereconnexion = CURRENT_TIMESTAMP WHERE id_user = :id');
    $stmt->execute([':id' => $idUser]);

    // Enregistrer la session
    $ipAddress = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    // Si c'est une liste d'IPs (proxy), prendre la première
    if (strpos($ipAddress, ',') !== false) {
        $ips = explode(',', $ipAddress);
        $ipAddress = trim($ips[0]);
    }
    
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';

    // Fermer les sessions actives identiques pour éviter les doublons
    $stmt = $pdo->prepare('UPDATE Session SET active = false WHERE id_user = :user_id AND adresse_ip = :ip AND user_agent = :agent AND active = true');
    $stmt->execute([
        ':user_id' => $idUser,
        ':ip' => $ipAddress,
        ':agent' => $userAgent,
    ]);
    
    $stmt = $pdo->prepare('
        INSERT INTO Session (id_user, adresse_ip, user_agent, active)
        VALUES (:user_id, :ip, :agent, true)
    ');
    $stmt->execute([
        ':user_id' => $idUser,
        ':ip' => $ipAddress,
        ':agent' => $userAgent,
    ]);

    $token = gp_jwt_sign([
        'sub' => (string)$idUser,
        'email' => (string)$user['email'],
        'statutUser' => $statutUser,
        'role' => $role,
    ], $config['jwt']);

    gp_send_json(200, [
        'message' => 'Connexion réussie',
        'token' => $token,
        'user' => [
            'idUser' => $idUser,
            'nomUser' => (string)($user['nomuser'] ?? ''),
            'prenomUser' => (string)($user['prenomuser'] ?? ''),
            'email' => (string)($user['email'] ?? ''),
            'statutUser' => $statutUser,
            'pdpUser' => $user['pdpuser'] ?? null,
            'role' => $role,
        ],
    ]);
} catch (Throwable $e) {
    $msg = (!empty($config['debug'])) ? ($e->getMessage() ?: 'Erreur serveur') : 'Erreur serveur';
    gp_send_json(500, ['message' => $msg]);
}
