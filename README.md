# Projet-BD-PHP-Web (GreenPulse)
Plateforme de gamification pour la gestion de défis écologiques en entreprise.

## Fonctionnalites
- multi-utilisateurs (employes en equipes, animateurs developpement durable, administrateurs RH)
- multi-etapes (defi mensuel, validation hebdomadaire, calcul des points)
- dynamique (classement en direct, deblocage progressif, forum lie aux defis)
- multi-analyses (impact carbone, thematiques populaires, aide a la strategie RSE)
- multi-sessions (profils individuels et comptes "Equipe")

## Acces au site deploye
Depuis le reseau WiFi STRI-LABS-WLAN, le site est accessible via:

http://greenpulse.stri

Ce domaine pointe vers un conteneur Incus et le front est gere via Nginx.

## Pre-requis locaux
- PHP 8.x (CLI + serveur integre)
- PostgreSQL 14+ et l'outil `psql`
- (Optionnel) SMTP si vous activez l'envoi d'emails

## Lancer le projet en local (sans Nginx)
Le projet expose l'application via le routeur PHP integre (`router.php`).

### 1) Base de donnees
Initialiser la base (schema + migrations + seed optionnel):

macOS / Linux:
```bash
bash db/init-postgres.sh
```

Windows (PowerShell):
```powershell
./db/init-postgres.ps1
```

Par defaut, les scripts utilisent:
- base: `greenpulse`
- utilisateur: `postgres` (macOS/Linux) ou `greenpulse` (Windows)
- mot de passe: `postgres` (macOS/Linux) ou `Greenpulse1234` (Windows)

Pensez a aligner ces valeurs avec la config applicative (voir section Configuration).

### 2) Configuration applicative
Le fichier [api/config.php](api/config.php) charge des variables depuis `.env` (a la racine) et
peut etre surcharge par [api/config.local.php](api/config.local.php).

Recommande:
- creer un fichier `.env` (non versionne)
- y definir les variables suivantes

Exemple `.env`:
```ini
GP_APP_BASE_URL=http://localhost:8000
GP_DB_HOST=localhost
GP_DB_PORT=5432
GP_DB_NAME=greenpulse
GP_DB_USER=postgres
GP_DB_PASS=postgres
GP_JWT_SECRET=change_this_secret
GP_MAIL_DRIVER=mail
GP_CORS_ORIGIN=*
```

Notes:
- Si vous utilisez Windows et le script `db/init-postgres.ps1`, ajustez `GP_DB_USER` et
	`GP_DB_PASS` en consequence.
- `api/config.local.php` est charge en dernier; evitez d'y stocker des secrets en clair
	si le depot est partage.

### 3) Demarrer le serveur PHP integre
Depuis la racine du projet:

macOS / Linux:
```bash
php -S localhost:8000 -t public/
```

Windows (PowerShell):
```powershell
php -S localhost:8000 -t public/
```

Ensuite, ouvrez:

http://localhost:8000

## Points d'entree utiles
- Front: [public/](public/)
- Routeur HTTP: [router.php](router.php)
- API: [api/](api/)
- Scripts DB: [db/](db/)
- Tests: [tests/](tests/)

## Tests Unitaires
Le projet dispose d'une suite de tests unitaires complète pour le back-end (PHPUnit) et le front-end (Jest).

### Exécuter les tests
Assurez-vous d'avoir installé les dépendances avant de lancer les tests :
```bash
npm install
php composer.phar install
```

Commandes pour lancer les tests :
- **Tests JS (Jest) :** `npm test` (ou `npm run test:coverage` pour le rapport de couverture)
- **Tests PHP (PHPUnit) :** `php composer.phar test` (ou `php composer.phar test-coverage`)

## Arborescence du projet (hors .git)
```
.
├── README.md
├── composer.json
├── package.json
├── phpunit.xml
├── jest.config.js
├── favicon.ico
├── index.php
├── router.php
├── send_inactivity_email_now.php
├── test_gmail.php
├── api
│   ├── bootstrap.php
│   ├── config.php
│   ├── config.local.php
│   ├── auth
│   │   ├── forgot-password.php
│   │   ├── login.php
│   │   ├── me.php
│   │   ├── register.php
│   │   ├── reset-password.php
│   │   ├── update-password.php
│   │   ├── update-profile.php
│   │   └── upload-photo.php
│   ├── lib
│   │   ├── auth.php
│   │   ├── db.php
│   │   ├── http.php
│   │   ├── jwt.php
│   │   └── mail.php
│   └── modules
│       ├── admin
│       │   └── dashboardRH.php
│       ├── animator
│       │   ├── badges.php
│       │   └── index.php
│       ├── challenges
│       │   └── index.php
│       ├── documents
│       │   └── index.php
│       ├── employee
│       │   ├── challenge-detail.php
│       │   ├── challenges.php
│       │   ├── dashboard.php
│       │   ├── forum-message.php
│       │   ├── index.php
│       │   ├── profile.php
│       │   ├── rankings.php
│       │   ├── submit-action.php
│       │   └── team-detail.php
│       ├── moderation
│       │   └── index.php
│       ├── profile
│       │   ├── 2fa.php
│       │   ├── account.php
│       │   ├── index.php
│       │   └── security.php
│       ├── settings
│       │   └── index.php
│       ├── statistics
│       │   └── index.php
│       ├── teams
│       │   └── team-management.php
│       └── users
│           └── user-management.php
├── db
│   ├── init-postgres.ps1
│   ├── init-postgres.sh
│   ├── migrations
│   │   ├── 001_add_password_change_tracking.sql
│   │   ├── 002_add_sessions_tracking.sql
│   │   ├── 003_expand_badge_icon_column.sql
│   │   ├── 004_add_reponse_defi_action.sql
│   │   ├── 004_alter_datemessage_message.sql
│   │   ├── 005_add_appartenir_table.sql
│   │   ├── 006_fix_regroupe_ordre_par_mois.sql
│   │   ├── 007_fix_pk_regroupe_add_mois.sql
│   │   ├── 008_add_mois_to_valider.sql
│   │   ├── 009_add_mois_to_forum.sql
│   │   ├── 010_fix_valider_pk.sql
│   │   └── 011_add_2fa.sql
│   ├── schema.sql
│   ├── script_présentation.sql
│   ├── seed_appartenir.sql
│   ├── seed_dashboard_stats.sql
│   └── seed_new.sql
├── deploy
│   ├── db
│   │   └── init-greenpulse.sql
│   ├── env
│   │   └── greenpulse.env.example
│   ├── nginx
│   │   └── greenpulse.conf
│   └── php-fpm
│       └── greenpulse.conf
├── public
│   ├── auth.html
│   ├── favicon.ico
│   ├── index.php
│   ├── reset-password.html
│   ├── assets
│   │   ├── css
│   │   │   └── (fichiers css...)
│   │   ├── js
│   │   │   └── (fichiers js vanilla...)
│   │   └── logo.png
│   ├── image
│   │   ├── pdp
│   │   └── preuves
│   └── pages
│       └── (fichiers html...)
└── tests
    ├── README.md
    ├── js
    │   ├── setup.js
    │   └── unit
    │       ├── 2fa.test.js
    │       ├── auth.test.js
    │       ├── dashboard.test.js
    │       ├── reset-password.test.js
    │       ├── storage.test.js
    │       └── validation.test.js
    └── php
        ├── Unit
        │   ├── AuthTest.php
        │   ├── ChallengesTest.php
        │   ├── DatabaseTest.php
        │   ├── JwtTest.php
        │   └── PointsTest.php
        └── bootstrap.php
```
