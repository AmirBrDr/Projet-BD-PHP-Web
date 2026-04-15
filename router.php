<?php

// Fichier: router.php - API et logique serveur.

declare(strict_types=1);

$uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$publicDir = __DIR__ . '/public';
$apiDir = __DIR__ . '/api';

if ($uriPath === '/' || $uriPath === '/login' || $uriPath === '/register' || $uriPath === '/login.php' || $uriPath === '/register.php') {
    require $publicDir . '/auth.html';
    return true;
}

$publicPath = $publicDir . $uriPath;
if (is_file($publicPath)) {
    return false;
}

if (str_starts_with($uriPath, '/api/')) {
    $apiPath = $apiDir . substr($uriPath, 4);
    if (is_file($apiPath)) {
        if (pathinfo($apiPath, PATHINFO_EXTENSION) === 'php') {
            require $apiPath;
            return true;
        }

        return false;
    }
}

http_response_code(404);
header('Content-Type: text/plain; charset=utf-8');
echo 'Not Found';
return true;