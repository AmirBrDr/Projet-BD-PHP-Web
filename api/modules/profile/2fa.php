<?php

// Fichier: api/modules/profile/2fa.php - API et logique serveur.

declare(strict_types=1);

require __DIR__ . '/../../bootstrap.php';

// Vérifier que la méthode HTTP est POST
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    gp_send_json(405, ['message' => 'Méthode non autorisée']);
}

// Récupérer et valider le token JWT
$token = gp_get_bearer_token();
if ($token === '') {
    gp_send_json(401, ['message' => 'Token manquant']);
}

try {
    $payload = gp_jwt_verify($token, $config['jwt']);
    $idUser = (int)($payload['sub'] ?? 0);

    $pdo = gp_pdo($config);
    $stmt = $pdo->prepare('SELECT id_user, prenomuser, nomuser, email, two_factor_enabled, two_factor_code, two_factor_expires_at FROM utilisateur WHERE id_user = :id LIMIT 1');
    $stmt->execute([':id' => $idUser]);
    $user = $stmt->fetch();

    if (!$user) {
        gp_send_json(404, ['message' => 'Utilisateur introuvable']);
    }

    $body = gp_read_json_body();
    $action = trim((string)($body['action'] ?? ''));

    if ($action === 'request-enable') {
        // Phase 1: generer et envoyer un code OTP par email
        if (!empty($user['two_factor_enabled'])) {
            gp_send_json(400, ['message' => 'La 2FA est déjà activée']);
        }
        
        $code = sprintf('%06d', mt_rand(0, 999999));
        $expires = date('Y-m-d H:i:s', time() + 600);
        
        $stmt = $pdo->prepare('UPDATE utilisateur SET two_factor_code = :code, two_factor_expires_at = :expires WHERE id_user = :id');
        $stmt->execute([
            ':code' => password_hash($code, PASSWORD_DEFAULT),
            ':expires' => $expires,
            ':id' => $idUser
        ]);
        
        $displayName = trim((string)($user['prenomuser'] ?? '') . ' ' . (string)($user['nomuser'] ?? ''));
        $subject = 'GreenPulse - Activation de la 2FA';
        $htmlBody = '<!doctype html><html><body style="font-family:Arial,sans-serif;background:#071225;color:#fff;padding:24px;">'
            . '<div style="max-width:640px;margin:0 auto;background:#0a1830;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:24px;">'
            . '<h2 style="margin-top:0;color:#2bd47c;">Activation de la double authentification</h2>'
            . '<p>Bonjour ' . htmlspecialchars($displayName !== '' ? $displayName : 'utilisateur', ENT_QUOTES, 'UTF-8') . ',</p>'
            . '<p>Voici le code pour confirmer l\'activation de la 2FA sur votre compte :</p>'
            . '<h1 style="letter-spacing:4px;color:#2bd47c;font-size:32px;">' . $code . '</h1>'
            . '<p>Ce code expire dans 10 minutes.</p>'
            . '</div></body></html>';
        $textBody = "Bonjour {$displayName},\n\nVotre code d'activation 2FA est : {$code}\n\nCe code expire dans 10 minutes.";
        
        gp_send_email($config, (string)$user['email'], $subject, $htmlBody, $textBody);
        
        gp_send_json(200, ['message' => 'Code d\'activation envoyé par email']);

    } elseif ($action === 'confirm-enable') {
        // Phase 2: verifier le code et activer la 2FA
        $otp = trim((string)($body['otp'] ?? ''));
        if ($otp === '') {
            gp_send_json(400, ['message' => 'Code OTP manquant']);
        }
        
        if (empty($user['two_factor_expires_at']) || strtotime((string)$user['two_factor_expires_at']) < time() || empty($user['two_factor_code']) || !password_verify($otp, (string)$user['two_factor_code'])) {
            gp_send_json(401, ['message' => 'Code OTP invalide ou expiré']);
        }
        
        $stmt = $pdo->prepare('UPDATE utilisateur SET two_factor_enabled = TRUE, two_factor_code = NULL, two_factor_expires_at = NULL WHERE id_user = :id');
        $stmt->execute([':id' => $idUser]);
        
        gp_send_json(200, ['message' => '2FA activée avec succès']);

    } elseif ($action === 'disable') {
        // Desactivation immediate de la 2FA
        $stmt = $pdo->prepare('UPDATE utilisateur SET two_factor_enabled = FALSE, two_factor_code = NULL, two_factor_expires_at = NULL WHERE id_user = :id');
        $stmt->execute([':id' => $idUser]);
        
        gp_send_json(200, ['message' => '2FA désactivée avec succès']);

    } elseif ($action === 'status') {
        // Retourne l'etat d'activation
        gp_send_json(200, ['two_factor_enabled' => !empty($user['two_factor_enabled'])]);
    } else {
        gp_send_json(400, ['message' => 'Action invalide']);
    }

} catch (Throwable $e) {
    $msg = (!empty($config['debug'])) ? ($e->getMessage() ?: 'Token invalide ou erreur serveur') : 'Erreur serveur';
    gp_send_json(401, ['message' => $msg]);
}
