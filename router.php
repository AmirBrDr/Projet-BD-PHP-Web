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
    $ext = pathinfo($publicPath, PATHINFO_EXTENSION);
    $mimeTypes = [
        'css' => 'text/css',
        'js' => 'application/javascript',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'html' => 'text/html',
        'json' => 'application/json',
    ];
    $contentType = $mimeTypes[$ext] ?? 'application/octet-stream';
    header('Content-Type: ' . $contentType);
    readfile($publicPath);
    return true;
}

if (str_starts_with($uriPath, '/api/')) {
    // Route API requests through modules structure
    $apiSubPath = substr($uriPath, 5); // Remove '/api/'
    
    // Map module routes
    $moduleRoutes = [
        'profile' => 'modules/profile/index.php',
        'profile/security' => 'modules/profile/security.php',
        'auth/login' => 'auth/login.php',
        'auth/register' => 'auth/register.php',
        'auth/me' => 'auth/me.php',
        'auth/forgot-password' => 'auth/forgot-password.php',
        'auth/reset-password' => 'auth/reset-password.php',
    ];

    // Check for exact route match first
    if (isset($moduleRoutes[$apiSubPath])) {
        $apiPath = $apiDir . '/' . $moduleRoutes[$apiSubPath];
        if (is_file($apiPath) && pathinfo($apiPath, PATHINFO_EXTENSION) === 'php') {
            require $apiPath;
            return true;
        }
    }

    // Try direct file path
    $apiPath = $apiDir . '/' . $apiSubPath;
    if (is_file($apiPath)) {
        if (pathinfo($apiPath, PATHINFO_EXTENSION) === 'php') {
            require $apiPath;
            return true;
        }
        return false;
    }

    // Check if directory with index.php
    if (is_dir($apiPath) && is_file($apiPath . '/index.php')) {
        require $apiPath . '/index.php';
        return true;
    }
}

http_response_code(404);
header('Content-Type: text/plain; charset=utf-8');
echo 'Not Found';
return true;