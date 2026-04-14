<?php

declare(strict_types=1);

function gp_mail_read_response($stream): string
{
    $lines = [];

    while (!feof($stream)) {
        $line = fgets($stream, 515);
        if ($line === false) {
            break;
        }

        $lines[] = trim($line);
        if (preg_match('/^\d{3}\s/', $line)) {
            break;
        }
    }

    return trim(implode("\n", $lines));
}

function gp_mail_send_command($stream, string $command, array $expectedPrefixes): string
{
    fwrite($stream, $command . "\r\n");
    $response = gp_mail_read_response($stream);

    foreach ($expectedPrefixes as $prefix) {
        if (str_starts_with($response, $prefix)) {
            return $response;
        }
    }

    throw new RuntimeException('SMTP error: ' . $response);
}

function gp_send_via_smtp(array $config, string $to, string $subject, string $htmlBody): void
{
    $mailConfig = $config['mail'] ?? [];
    $host = (string)($mailConfig['smtp_host'] ?? '');
    if ($host === '') {
        throw new RuntimeException('Serveur SMTP non configuré');
    }

    $port = (int)($mailConfig['smtp_port'] ?? 587);
    $timeout = (int)($mailConfig['smtp_timeout'] ?? 10);
    $username = (string)($mailConfig['smtp_username'] ?? '');
    $password = (string)($mailConfig['smtp_password'] ?? '');
    $encryption = strtolower((string)($mailConfig['smtp_encryption'] ?? 'tls'));
    $fromEmail = (string)($mailConfig['from_email'] ?? 'no-reply@greenpulse.local');
    $fromName = (string)($mailConfig['from_name'] ?? 'GreenPulse');

    $remoteHost = $encryption === 'ssl' ? 'ssl://' . $host : $host;
    $stream = @stream_socket_client(sprintf('%s:%d', $remoteHost, $port), $errno, $errstr, $timeout);

    if (!$stream) {
        throw new RuntimeException('Connexion SMTP impossible: ' . $errstr);
    }

    stream_set_timeout($stream, $timeout);

    try {
        $response = gp_mail_read_response($stream);
        if (!str_starts_with($response, '220')) {
            throw new RuntimeException('SMTP error: ' . $response);
        }

        $hostname = gethostname() ?: 'localhost';
        gp_mail_send_command($stream, 'EHLO ' . $hostname, ['250']);

        if ($encryption === 'tls') {
            gp_mail_send_command($stream, 'STARTTLS', ['220']);
            if (!stream_socket_enable_crypto($stream, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('Impossible d’activer TLS');
            }
            gp_mail_send_command($stream, 'EHLO ' . $hostname, ['250']);
        }

        if ($username !== '') {
            gp_mail_send_command($stream, 'AUTH LOGIN', ['334']);
            gp_mail_send_command($stream, base64_encode($username), ['334']);
            gp_mail_send_command($stream, base64_encode($password), ['235']);
        }

        gp_mail_send_command($stream, 'MAIL FROM:<' . $fromEmail . '>', ['250']);
        gp_mail_send_command($stream, 'RCPT TO:<' . $to . '>', ['250', '251']);
        gp_mail_send_command($stream, 'DATA', ['354']);

        $headers = [
            'From: ' . sprintf('%s <%s>', $fromName, $fromEmail),
            'To: <' . $to . '>',
            'Subject: ' . $subject,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            'Content-Transfer-Encoding: 8bit',
        ];

        $payload = implode("\r\n", $headers) . "\r\n\r\n" . $htmlBody;
        $payload = preg_replace('/\r?\n\./', "\r\n..", $payload) ?? $payload;
        fwrite($stream, $payload . "\r\n.\r\n");

        $response = gp_mail_read_response($stream);
        if (!str_starts_with($response, '250')) {
            throw new RuntimeException('SMTP error: ' . $response);
        }

        gp_mail_send_command($stream, 'QUIT', ['221']);
    } finally {
        fclose($stream);
    }
}

function gp_send_email(array $config, string $to, string $subject, string $htmlBody, string $textBody = ''): void
{
    $mailConfig = $config['mail'] ?? [];
    $fromEmail = (string)($mailConfig['from_email'] ?? 'no-reply@greenpulse.local');
    $fromName = (string)($mailConfig['from_name'] ?? 'GreenPulse');
    $replyTo = (string)($mailConfig['reply_to'] ?? $fromEmail);
    $driver = strtolower((string)($mailConfig['driver'] ?? 'mail'));

    $encodedSubject = function_exists('mb_encode_mimeheader')
        ? mb_encode_mimeheader($subject, 'UTF-8')
        : $subject;

    if ($driver === 'smtp' && (string)($mailConfig['smtp_host'] ?? '') !== '') {
        gp_send_via_smtp($config, $to, $encodedSubject, $htmlBody);
        return;
    }

    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'From: ' . sprintf('%s <%s>', $fromName, $fromEmail),
        'Reply-To: ' . $replyTo,
        'X-Mailer: PHP/' . phpversion(),
    ];

    if (!function_exists('mail') || !@mail($to, $encodedSubject, $htmlBody, implode("\r\n", $headers))) {
        throw new RuntimeException('Impossible d\'envoyer le mail de réinitialisation');
    }
}