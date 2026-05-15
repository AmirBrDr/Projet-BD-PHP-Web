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

    $stmt = $pdo->prepare('SELECT id_user, nomuser, prenomuser, email, statutuser, pdpuser, mdp, two_factor_enabled, two_factor_code, two_factor_expires_at FROM utilisateur WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();

    // Valider le mot de passe
    if (!$user || !isset($user['mdp']) || !password_verify($mdp, (string)$user['mdp'])) {
        gp_send_json(401, ['message' => 'Identifiants invalides']);
    }

    // Gérer le 2FA si activé
    if (!empty($user['two_factor_enabled'])) {
        $otp = trim((string)($body['otp'] ?? ''));
        if ($otp === '') {
            // Mode challenge: générer et envoyer un code temporaire
            $code = sprintf('%06d', mt_rand(0, 999999));
            $expires = date('Y-m-d H:i:s', time() + 600);
            
            $stmt = $pdo->prepare('UPDATE utilisateur SET two_factor_code = :code, two_factor_expires_at = :expires WHERE id_user = :id');
            $stmt->execute([
                ':code' => password_hash($code, PASSWORD_DEFAULT),
                ':expires' => $expires,
                ':id' => $user['id_user']
            ]);
            
            $displayName = trim((string)($user['prenomuser'] ?? '') . ' ' . (string)($user['nomuser'] ?? ''));
            $subject = 'GreenPulse - Votre code de connexion (2FA)';
            $htmlBody = '<!doctype html><html><body style="font-family:Arial,sans-serif;background:#071225;color:#fff;padding:24px;">'
                . '<div style="max-width:640px;margin:0 auto;background:#0a1830;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:24px;">'
                . '<h2 style="margin-top:0;color:#2bd47c;">Code de connexion</h2>'
                . '<p>Bonjour ' . htmlspecialchars($displayName !== '' ? $displayName : 'utilisateur', ENT_QUOTES, 'UTF-8') . ',</p>'
                . '<p>Voici votre code de sécurité pour vous connecter :</p>'
                . '<h1 style="letter-spacing:4px;color:#2bd47c;font-size:32px;">' . $code . '</h1>'
                . '<p>Ce code expire dans 10 minutes.</p>'
                . '</div></body></html>';
            $textBody = "Bonjour {$displayName},\n\nVotre code de connexion est : {$code}\n\nCe code expire dans 10 minutes.";
            
            gp_send_email($config, (string)$user['email'], $subject, $htmlBody, $textBody);
            
            gp_send_json(202, ['message' => 'Code 2FA envoyé par email', 'requires_2fa' => true]);
        } else {
            // Mode validation: vérifier le code reçu et sa date d'expiration
            if (empty($user['two_factor_expires_at']) || strtotime((string)$user['two_factor_expires_at']) < time() || empty($user['two_factor_code']) || !password_verify($otp, (string)$user['two_factor_code'])) {
                gp_send_json(401, ['message' => 'Code 2FA invalide ou expiré']);
            }
            
            $stmt = $pdo->prepare('UPDATE utilisateur SET two_factor_code = NULL, two_factor_expires_at = NULL WHERE id_user = :id');
            $stmt->execute([':id' => $user['id_user']]);
        }
    }

    // Récupérer le rôle de l'utilisateur
    $idUser = (int)$user['id_user'];
    $statutUser = (string)($user['statutuser'] ?? '');
    $role = gp_resolve_user_role($pdo, $idUser);

    if ($role === null) {
        gp_send_json(403, ['message' => 'Compte sans rôle associé']);
    }

    // Tracking non bloquant: l'authentification reste valide même si les migrations
    // de suivi (derniereconnexion / Session) n'ont pas encore été appliquées.
    try {
        $stmt = $pdo->prepare('UPDATE utilisateur SET derniereconnexion = CURRENT_TIMESTAMP WHERE id_user = :id');
        $stmt->execute([':id' => $idUser]);
    } catch (Throwable $trackingError) {
        if (!empty($config['debug'])) {
            error_log('Login tracking warning (derniereconnexion): ' . $trackingError->getMessage());
        }
    }

    try {
        $ipAddress = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        if (strpos($ipAddress, ',') !== false) {
            $ips = explode(',', $ipAddress);
            $ipAddress = trim($ips[0]);
        }

        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';

        $stmt = $pdo->prepare('
            INSERT INTO Session (id_user, adresse_ip, user_agent, active)
            VALUES (:user_id, :ip, :agent, true)
        ');
        $stmt->execute([
            ':user_id' => $idUser,
            ':ip' => $ipAddress,
            ':agent' => $userAgent,
        ]);
    } catch (Throwable $trackingError) {
        if (!empty($config['debug'])) {
            error_log('Login tracking warning (Session): ' . $trackingError->getMessage());
        }
    }

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
