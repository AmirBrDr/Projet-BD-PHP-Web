<?php

// Fichier: api/auth/forgot-password.php - API et logique serveur.

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

// Vérifier que la méthode HTTP est POST
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    gp_send_json(405, ['message' => 'Méthode non autorisée']);
}

// Récupérer l'email fourni
$body = gp_read_json_body();
$email = trim((string)($body['email'] ?? ''));

if ($email === '') {
    gp_send_json(400, ['message' => 'Email requis']);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    gp_send_json(400, ['message' => 'Email invalide']);
}

// Chercher l'utilisateur et générer un token de réinitialisation
try {
    $pdo = gp_pdo($config);
    // Vérifier si l'utilisateur existe
    $stmt = $pdo->prepare('SELECT id_user, nomuser, prenomuser, email, statutuser FROM utilisateur WHERE LOWER(email) = LOWER(:email) LIMIT 1');
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();

    // Ne jamais révéler l'existence du compte (anti-énumération)
    if (!$user) {
        gp_send_json(200, ['message' => 'Si ce compte existe, un email de réinitialisation a été envoyé.']);
    }

    // Token de reset à durée limitée, signé avec la clé JWT
    $resetToken = gp_password_reset_sign([
        'sub' => (string)$user['id_user'],
        'email' => (string)$user['email'],
    ], [
        'secret' => $config['jwt']['secret'],
        'issuer' => $config['jwt']['issuer'],
        'audience' => $config['jwt']['audience'],
        'ttl_seconds' => (int)($config['mail']['reset_ttl_seconds'] ?? 1800),
    ]);

    // Construire l'URL de reset côté frontend
    $baseUrl = rtrim((string)($config['app']['base_url'] ?? 'http://localhost:8000'), '/');
    $resetUrl = $baseUrl . '/reset-password.html?token=' . rawurlencode($resetToken);
    $displayName = trim((string)($user['prenomuser'] ?? '') . ' ' . (string)($user['nomuser'] ?? ''));

    $subject = 'GreenPulse - Réinitialisation de votre mot de passe';
    $htmlBody = '<!doctype html><html><body style="font-family:Arial,sans-serif;background:#071225;color:#fff;padding:24px;">'
        . '<div style="max-width:640px;margin:0 auto;background:#0a1830;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:24px;">'
        . '<h2 style="margin-top:0;color:#2bd47c;">Réinitialisation de mot de passe</h2>'
        . '<p>Bonjour ' . htmlspecialchars($displayName !== '' ? $displayName : 'utilisateur', ENT_QUOTES, 'UTF-8') . ',</p>'
        . '<p>Nous avons reçu une demande de réinitialisation pour votre compte GreenPulse.</p>'
        . '<p style="margin:24px 0;"><a href="' . htmlspecialchars($resetUrl, ENT_QUOTES, 'UTF-8') . '" style="display:inline-block;background:#2bd47c;color:#05111f;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:10px;">Définir un nouveau mot de passe</a></p>'
        . '<p>Ce lien expire bientôt pour votre sécurité. Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer ce message.</p>'
        . '<p style="color:rgba(255,255,255,.65);font-size:12px;">Lien direct : ' . htmlspecialchars($resetUrl, ENT_QUOTES, 'UTF-8') . '</p>'
        . '</div></body></html>';
    $textBody = "Bonjour {$displayName},\n\nDéfinir un nouveau mot de passe : {$resetUrl}\n\nCe lien expire bientôt.";

    gp_send_email($config, (string)$user['email'], $subject, $htmlBody, $textBody);

    gp_send_json(200, ['message' => 'Si ce compte existe, un email de réinitialisation a été envoyé.']);
} catch (Throwable $e) {
    $msg = (!empty($config['debug'])) ? ($e->getMessage() ?: 'Erreur serveur') : 'Erreur serveur';
    gp_send_json(500, ['message' => $msg]);
}