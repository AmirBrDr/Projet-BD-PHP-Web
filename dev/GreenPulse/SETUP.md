# Configuration GreenPulse - Guide d'installation

## Prérequis

- **PostgreSQL 12+** installé et en cours d'exécution
- **PHP 8.2+** avec le driver pgsql activé
- **XAMPP** ou équivalent

## Étape 1 : Vérifier PostgreSQL

### Windows

Ouvrez PowerShell et vérifiez que PostgreSQL est accessible :

```powershell
psql --version
```

Si la commande n'est pas reconnue, ajoutez PostgreSQL au PATH système ou utilisez le chemin complet.

### Démarrer PostgreSQL (si nécessaire)

Sur Windows, PostgreSQL s'exécute généralement en tant que service. Vérifiez dans Services Windows.

## Étape 2 : Initialiser la base de données

### Option A : Utiliser le script PowerShell (Recommandé pour Windows)

```powershell
cd C:\xampp\htdocs\PHP
.\db\init-postgres.ps1
```

Si vous avez une erreur de permission, exécutez d'abord :
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

### Option B : Commandes manuelles

```powershell
# Créer la base de données
psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE greenpulse;"

# Appliquer le schéma
psql -h localhost -p 5432 -U postgres -d greenpulse -f db\schema.sql
```

## Étape 3 : Tester la configuration

```powershell
# Vérifier la connexion
psql -h localhost -p 5432 -U postgres -d greenpulse -c "SELECT COUNT(*) FROM utilisateur;"
```

Vous devriez vous connecter sans erreur.

## Étape 4 : (Optionnel) Créer un utilisateur dédié

Pour une meilleure sécurité, créez un utilisateur PostgreSQL spécifique :

```powershell
psql -h localhost -p 5432 -U postgres -c "CREATE USER greenpulse WITH PASSWORD 'votremotdepasse';"
psql -h localhost -p 5432 -U postgres -c "ALTER ROLE greenpulse CREATEDB;"
psql -h localhost -p 5432 -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE greenpulse TO greenpulse;"
```

Puis mettez à jour `api/config.php` :

```php
'db' => [
    'host' => getenv('GP_DB_HOST') ?: 'localhost',
    'port' => getenv('GP_DB_PORT') ?: '5432',
    'name' => getenv('GP_DB_NAME') ?: 'greenpulse',
    'user' => getenv('GP_DB_USER') ?: 'greenpulse',  // Changez en 'greenpulse'
    'pass' => getenv('GP_DB_PASS') ?: 'votremotdepasse',  // Votre mot de passe
],
```

## Troubleshooting

### Erreur : "Impossible de se connecter au serveur"

- Vérifiez que PostgreSQL est en cours d'exécution
- Vérifiez le host, le port et les credentials
- Vérifiez les pare-feu

### Erreur : "La base de données n'existe pas"

```powershell
psql -h localhost -U postgres -l
```

Cette commande affiche toutes les bases disponibles.

### Erreur : "Erreur serveur" en POST /api/auth/register.php

- Activez le debug en créant `api/config.local.php` :

```php
<?php
return [
    'debug' => true,
];
```

Relancez la requête pour voir le message d'erreur exact.

## Redémarrer le serveur de développement

```powershell
cd C:\xampp\htdocs\PHP
& 'C:\xampp\php\php.exe' -S localhost:8000 -t public router.php
```

Puis accédez à http://localhost:8000

## Déploiement production (Nginx)

Consultez le guide complet :

- `dev/GreenPulse/DEPLOY_NGINX.md`
