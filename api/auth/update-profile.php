<?php

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

// Endpoint protégé: mise à jour des infos de profil
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    gp_send_json(405, ['message' => 'Méthode non autorisée']);
}

$token = gp_get_bearer_token();
if ($token === '') {
    gp_send_json(401, ['message' => 'Token manquant']);
}

try {
    $payload = gp_jwt_verify($token, $config['jwt']);
    $userId = (int) ($payload['sub'] ?? 0);
    if ($userId <= 0) {
        gp_send_json(401, ['message' => 'Token invalide']);
    }
} catch (Throwable $e) {
    gp_send_json(401, ['message' => 'Token invalide']);
}

$body       = gp_read_json_body();
$nomUser    = trim((string) ($body['nomUser']    ?? ''));
$prenomUser = trim((string) ($body['prenomUser'] ?? ''));
$email      = trim((string) ($body['email']      ?? ''));

if ($nomUser === '' || $prenomUser === '') {
    gp_send_json(400, ['message' => 'Nom et prénom sont requis']);
}

if (strlen($nomUser) < 2 || strlen($prenomUser) < 2) {
    gp_send_json(400, ['message' => 'Nom et prénom doivent contenir au moins 2 caractères']);
}

if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    gp_send_json(400, ['message' => 'Adresse email invalide']);
}

$pdo = gp_pdo($config);

// Vérifier l'unicité de l'email si fourni
if ($email !== '') {
    $stmt = $pdo->prepare("SELECT 1 FROM Utilisateur WHERE email = :email AND Id_User != :id LIMIT 1");
    $stmt->execute([':email' => $email, ':id' => $userId]);
    if ($stmt->fetch()) {
        gp_send_json(409, ['message' => 'Cet email est déjà utilisé']);
    }
    $stmt = $pdo->prepare("
        UPDATE Utilisateur SET nomUser = :nom, prenomUser = :prenom, email = :email
        WHERE Id_User = :id RETURNING Id_User
    ");
    $stmt->execute([':nom' => $nomUser, ':prenom' => $prenomUser, ':email' => $email, ':id' => $userId]);
} else {
    $stmt = $pdo->prepare("
        UPDATE Utilisateur SET nomUser = :nom, prenomUser = :prenom
        WHERE Id_User = :id RETURNING Id_User
    ");
    $stmt->execute([':nom' => $nomUser, ':prenom' => $prenomUser, ':id' => $userId]);
}

if (!$stmt->fetch()) {
    gp_send_json(404, ['message' => 'Utilisateur introuvable']);
}

// Retourner l'utilisateur avec son role resolu
$stmt = $pdo->prepare("\n    SELECT u.Id_User, u.nomUser, u.prenomUser, u.email, u.pdpUser, u.statutUser,\n           COALESCE(r.role, 'employe') AS role\n    FROM Utilisateur u\n    LEFT JOIN LATERAL (\n        SELECT 'employe' AS role FROM Employe e WHERE e.Id_Employe = u.Id_User\n        UNION ALL\n        SELECT 'admin' AS role FROM Admin a WHERE a.Id_Admin = u.Id_User\n        UNION ALL\n        SELECT 'animateur' AS role FROM Animateur an WHERE an.Id_Animateur = u.Id_User\n        LIMIT 1\n    ) r ON TRUE\n    WHERE u.Id_User = :id\n    LIMIT 1\n");
$stmt->execute([':id' => $userId]);
$user = $stmt->fetch();

gp_send_json(200, [
    'message' => 'Profil mis à jour',
    'user' => [
        'idUser' => (int) $user['id_user'],
        'nomUser' => (string) $user['nomuser'],
        'prenomUser' => (string) $user['prenomuser'],
        'email' => (string) $user['email'],
        'pdpUser' => $user['pdpuser'] ?? null,
        'statutUser' => (string) $user['statutuser'],
        'role' => (string) $user['role'],
    ],
]);