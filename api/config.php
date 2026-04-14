<?php

declare(strict_types=1);

$envPath = dirname(__DIR__) . '/.env';
if (is_file($envPath) && is_readable($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
    foreach ($lines as $line) {
        $trimmed = trim($line);
        if ($trimmed === '' || str_starts_with($trimmed, '#')) {
            continue;
        }

        $parts = explode('=', $trimmed, 2);
        if (count($parts) !== 2) {
            continue;
        }

        $name = trim($parts[0]);
        $value = trim($parts[1]);

        if ($name === '') {
            continue;
        }

        if ($value !== '' && (($value[0] === '"' && substr($value, -1) === '"') || ($value[0] === '\'' && substr($value, -1) === '\''))) {
            $value = substr($value, 1, -1);
        }

        if (getenv($name) === false) {
            putenv($name . '=' . $value);
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

$config = [
    'debug' => (getenv('GP_DEBUG') === '1' || strtolower((string)getenv('GP_DEBUG')) === 'true'),
    'app' => [
        'base_url' => getenv('GP_APP_BASE_URL') ?: 'http://localhost:8000',
    ],
    'db' => [
        'host' => getenv('GP_DB_HOST') ?: 'localhost',
        'port' => getenv('GP_DB_PORT') ?: '5432',
        'name' => getenv('GP_DB_NAME') ?: 'greenpulse',
        'user' => getenv('GP_DB_USER') ?: 'postgres',
        'pass' => getenv('GP_DB_PASS') ?: 'postgres',
    ],
    'jwt' => [
        'secret' => getenv('GP_JWT_SECRET') ?: 'change_this_secret',
        'issuer' => getenv('GP_JWT_ISSUER') ?: 'greenpulse',
        'audience' => getenv('GP_JWT_AUDIENCE') ?: 'greenpulse',
        'ttl_seconds' => (int)(getenv('GP_JWT_TTL') ?: 60 * 60 * 24),
    ],
    'mail' => [
        'from_email' => getenv('GP_MAIL_FROM_EMAIL') ?: 'no-reply@greenpulse.local',
        'from_name' => getenv('GP_MAIL_FROM_NAME') ?: 'GreenPulse',
        'reply_to' => getenv('GP_MAIL_REPLY_TO') ?: 'no-reply@greenpulse.local',
        'driver' => getenv('GP_MAIL_DRIVER') ?: 'mail',
        // When using Gmail, set GP_MAIL_DRIVER=smtp and point the next values to smtp.gmail.com.
        'smtp_host' => getenv('GP_MAIL_SMTP_HOST') ?: '',
        'smtp_port' => (int)(getenv('GP_MAIL_SMTP_PORT') ?: 587),
        'smtp_username' => getenv('GP_MAIL_SMTP_USERNAME') ?: '',
        'smtp_password' => getenv('GP_MAIL_SMTP_PASSWORD') ?: '',
        'smtp_encryption' => getenv('GP_MAIL_SMTP_ENCRYPTION') ?: 'tls',
        'smtp_timeout' => (int)(getenv('GP_MAIL_SMTP_TIMEOUT') ?: 10),
        'reset_ttl_seconds' => (int)(getenv('GP_RESET_TTL') ?: 60 * 30),
    ],
    'cors' => [
        'allow_origin' => getenv('GP_CORS_ORIGIN') ?: '*',
    ],
];

$localPath = __DIR__ . '/config.local.php';
if (is_file($localPath)) {
    $local = require $localPath;
    if (is_array($local)) {
        $config = array_replace_recursive($config, $local);
    }
}

return $config;
