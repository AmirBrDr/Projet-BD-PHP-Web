<?php
require __DIR__ . '/api/bootstrap.php';

// Configuration Gmail temporaire pour les tests
$config['mail'] = [
    'from_email' => 'adam.briya29@gmail.com',
    'from_name' => 'GreenPulse Test',
    'reply_to' => 'adam.briya29@gmail.com',
    'driver' => 'smtp',
    'smtp_host' => 'smtp.gmail.com',
    'smtp_port' => 587,
    'smtp_username' => 'adam.briya29@gmail.com',
    'smtp_password' => 'yuicjirmmwhbzrvo', // Mot de passe d'application Gmail
    'smtp_encryption' => 'tls',
    'smtp_timeout' => 30,
];

try {
    $pdo = gp_pdo($config);

    // Tester l'envoi à une adresse spécifiée
    $email = 'adam.scorpion2004@gmail.com';
    $displayName = 'Adam Scorpion';

    echo "Test d'envoi à : $email ($displayName)\n";

    // Contenu du mail de test
    $subject = 'GreenPulse - Test Rappel d\'Inactivité';
    $htmlBody = '<!doctype html><html><body style="font-family:Arial,sans-serif;background:#071225;color:#fff;padding:24px;">'
        . '<div style="max-width:640px;margin:0 auto;background:#0a1830;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:24px;">'
        . '<h2 style="margin-top:0;color:#2bd47c;">Test - Rappel de participation</h2>'
        . '<p>Bonjour ' . htmlspecialchars($displayName, ENT_QUOTES, 'UTF-8') . ',</p>'
        . '<p>Ceci est un test d\'envoi de mail via Gmail SMTP.</p>'
        . '<p>Vous n\'avez pas accédé à GreenPulse depuis plus de 3 jours. Pensez à vous reconnecter !</p>'
        . '<p style="margin-top:24px;color:rgba(255,255,255,.75);">Test réussi si vous recevez ce mail.</p>'
        . '</div></body></html>';

    $textBody = "Bonjour $displayName,\n\nCeci est un test d'envoi de mail via Gmail SMTP.\n\nVous n'avez pas accédé à GreenPulse depuis plus de 3 jours.\n\nTest réussi si vous recevez ce mail.";

    // Tentative d'envoi avec débogage
    try {
        $result = gp_send_email($config, $email, $subject, $htmlBody, $textBody);
        echo "✅ Mail envoyé avec succès à $email !\n";
        echo "Vérifiez votre boîte mail (y compris les spams).\n";
    } catch (Exception $e) {
        echo "❌ Erreur lors de l'envoi: " . $e->getMessage() . "\n";
        $result = false;
    }

} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
}
?>