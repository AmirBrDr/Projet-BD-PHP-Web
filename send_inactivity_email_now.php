<?php
require __DIR__ . '/api/bootstrap.php';

// Configuration Gmail temporaire pour les tests
$config['mail'] = [
    'from_email' => 'adam.briya29@gmail.com',
    'from_name' => 'GreenPulse',
    'reply_to' => 'adam.briya29@gmail.com',
    'driver' => 'smtp',
    'smtp_host' => 'smtp.gmail.com',
    'smtp_port' => 587,
    'smtp_username' => 'adam.briya29@gmail.com',
    'smtp_password' => 'yuicjirmmwhbzrvo',
    'smtp_encryption' => 'tls',
    'smtp_timeout' => 30,
];

try {
    $to = 'adam.scorpion2004@gmail.com';
    $displayName = 'Adam Scorpion';

    $subject = 'GreenPulse - Rappel de participation';
    $frequencyText = 'une fois toutes les deux semaines';

    $htmlBody = '<!doctype html><html><body style="font-family:Arial,sans-serif;background:#071225;color:#fff;padding:24px;">'
        . '<div style="max-width:640px;margin:0 auto;background:#0a1830;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:24px;">'
        . '<h2 style="margin-top:0;color:#2bd47c;">Rappel de participation</h2>'
        . '<p>Bonjour ' . htmlspecialchars($displayName, ENT_QUOTES, 'UTF-8') . ',</p>'
        . '<p>Vous n’avez pas accédé à GreenPulse depuis plus de 3 jours. Pour rester dans le rythme du défi, pensez à vous reconnecter et à participer aux actions.</p>'
        . '<p>Ce type de rappel est envoyé ' . htmlspecialchars($frequencyText, ENT_QUOTES, 'UTF-8') . ' lorsque l’option est activée.</p>'
        . '<p style="margin-top:24px;color:rgba(255,255,255,.75);">Si vous avez déjà participé récemment, vous pouvez ignorer ce message.</p>'
        . '</div></body></html>';

    $textBody = "Bonjour {$displayName},\n\nVous n’avez pas accédé à GreenPulse depuis plus de 3 jours. Ce rappel est envoyé {$frequencyText}.\n\nConnectez-vous pour continuer à participer aux défis.";

    try {
        gp_send_email($config, $to, $subject, $htmlBody, $textBody);
        echo "✅ Mail d'inactivité envoyé à {$to}.\n";
    } catch (Throwable $e) {
        echo "❌ Erreur lors de l'envoi : " . $e->getMessage() . "\n";
    }
} catch (Throwable $e) {
    echo "Erreur : " . $e->getMessage() . "\n";
}
?>