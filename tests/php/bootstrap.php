<?php
// tests/php/bootstrap.php

// Définir l'environnement de test
define('APP_ENV', 'testing');

// Charger l'autoloader de Composer si présent (généré par composer install)
if (file_exists(__DIR__ . '/../../vendor/autoload.php')) {
    require_once __DIR__ . '/../../vendor/autoload.php';
}

// Définir une configuration fictive ou de test pour éviter d'utiliser la DB de prod
global $config;
$config = [
    'db' => [
        'host' => 'localhost',
        'port' => '5432',
        'name' => 'greenpulse_test',
        'user' => 'test_user',
        'pass' => 'test_pass'
    ],
    'jwt' => [
        'secret' => 'test_secret_key',
        'issuer' => 'greenpulse.test'
    ],
    'debug' => true,
    'cors' => [
        'allowed_origins' => ['*']
    ]
];

// Inclure les helpers nécessaires sans déclencher l'exécution de l'API (ex: gp_send_json)
// On inclut directement les fichiers de la librairie.
require_once __DIR__ . '/../../api/lib/http.php';
require_once __DIR__ . '/../../api/lib/db.php';
require_once __DIR__ . '/../../api/lib/jwt.php';
require_once __DIR__ . '/../../api/lib/auth.php';
require_once __DIR__ . '/../../api/lib/mail.php';

// Mock ou redéfinitions pour les tests si besoin (ex: gp_send_json pour éviter exit)
// Note: Il faut s'assurer que gp_send_json n'est pas appelé dans les tests unitaires purs.
