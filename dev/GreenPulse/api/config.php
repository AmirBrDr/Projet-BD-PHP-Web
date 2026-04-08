<?php

declare(strict_types=1);

$config = [
    'debug' => (getenv('GP_DEBUG') === '1' || strtolower((string)getenv('GP_DEBUG')) === 'true'),
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
