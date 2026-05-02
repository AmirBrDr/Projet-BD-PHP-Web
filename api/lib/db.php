<?php

// Fichier: api/lib/db.php - API et logique serveur.

declare(strict_types=1);

function gp_pdo(array $config): PDO
{
    $db = $config['db'];
    $dsn = sprintf('pgsql:host=%s;port=%s;dbname=%s', $db['host'], $db['port'], $db['name']);

    $pdo = new PDO($dsn, $db['user'], $db['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec("SET client_encoding = 'WIN1252'");
    return $pdo;
}