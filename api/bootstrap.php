<?php

// Fichier: api/bootstrap.php - API et logique serveur.

declare(strict_types=1);

// Charger la configuration globale (env + overrides locaux)
$config = require __DIR__ . '/config.php';

// Charger les helpers HTTP, DB, JWT, auth et mail
require __DIR__ . '/lib/http.php';
require __DIR__ . '/lib/db.php';
require __DIR__ . '/lib/jwt.php';
require __DIR__ . '/lib/auth.php';
require __DIR__ . '/lib/mail.php';

// Appliquer la politique CORS avant toute réponse
gp_apply_cors($config);
