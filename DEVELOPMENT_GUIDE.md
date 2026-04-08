# Connexion au serveur container via SSH

## Configuration SSH

Pour se connecter au serveur container, ajoutez la configuration suivante à votre fichier `~/.ssh/config` :

```
Host cServer
    HostName 2001:678:3fc:1c:1266:6aff:fea8:aa33
    User etu
    Port 2222
```

### Informations de connexion

- **Utilisateur** : `etu`
- **Mot de passe** : `webuserGreenPulse`

### Connexion

Une fois configuré, connectez-vous avec :

```bash
ssh cServer
```

---

# Guide de Développement GreenPulse

## Vue d'ensemble de la structure du projet

```
/srv/greenpulse/
├── api/
│   ├── auth/                 # Points de terminaison d'authentification
│   ├── lib/                  # Bibliothèques partagées (db, http, jwt)
│   ├── modules/              # Modules de fonctionnalités (NOUVEAU)
│   │   ├── admin/
│   │   ├── animator/
│   │   ├── employee/
│   │   ├── users/
│   │   ├── challenges/
│   │   ├── statistics/
│   │   ├── moderation/
│   │   ├── settings/
│   │   ├── teams/
│   │   └── documents/
│   ├── bootstrap.php
│   └── config.php
├── public/
│   ├── auth.html             # Page de connexion/inscription
│   ├── pages/                # Pages de l'application (NOUVEAU)
│   │   ├── dashboardRH.html
│   │   ├── dashboardE.html
│   │   ├── gestionUtilisateurs.html
│   │   ├── gestionDefis.html
│   │   ├── moderation.html
│   │   ├── parametresRH.html
│   │   ├── parametresAnimateur.html
│   │   ├── statistiques.html
│   │   ├── profil.html
│   │   ├── detailEquipe.html
│   │   ├── defis.html
│   │   ├── classement.html
│   │   ├── detailDefi.html
│   │   ├── documents.html
│   │   └── index.html
│   └── assets/
│       ├── css/              # Feuilles de style (NOUVEAU)
│       ├── js/               # Fichiers JavaScript (NOUVEAU)
│       └── logo.png
└── maquette/                 # Référence des maquettes UI
```

---

## Rôles utilisateur et pages

### 👨‍💼 **Admin RH (Administrateur RH)**
- **Dashboard RH** - `public/pages/dashboardRH.html` - Vue d'ensemble des métriques système
- **Gestion des Utilisateurs** - `public/pages/gestionUtilisateurs.html` - Gérer les utilisateurs
- **Gestion des Défis** - `public/pages/gestionDefis.html` - Gérer les défis
- **Modération** - `public/pages/moderation.html` - Examiner et modérer le contenu
- **Paramètres** - `public/pages/parametresRH.html` - Paramètres spécifiques RH

**Modules API :**
- `api/modules/admin/`
- `api/modules/users/`
- `api/modules/moderation/`
- `api/modules/settings/`

---

### 🎬 **Animateur**
- **Statistiques** - `public/pages/statistiques.html` - Voir les statistiques et analyses
- **Profil** - `public/pages/profil.html` - Profil utilisateur
- **Paramètres** - `public/pages/parametresAnimateur.html` - Paramètres animateur

**Modules API :**
- `api/modules/animator/`
- `api/modules/statistics/`

---

### 👥 **Employé**
- **Dashboard** - `public/pages/dashboardE.html` - Tableau de bord personnel
- **Équipe** - `public/pages/detailEquipe.html` - Détails et membres de l'équipe
- **Défis** - `public/pages/defis.html` - Liste des défis disponibles
- **Classement** - `public/pages/classement.html` - Classements/tableau des scores
- **Détail Défi** - `public/pages/detailDefi.html` - Détails du défi
- **Documents** - `public/pages/documents.html` - Référentiel de documents
- **Profil** - `public/pages/profil.html` - Profil utilisateur

**Modules API :**
- `api/modules/employee/`
- `api/modules/challenges/`
- `api/modules/teams/`
- `api/modules/documents/`

---

## Configuration initiale et installation

### Prérequis

Pour développer localement, vous aurez besoin de :
- **Git**
- **PHP 8.4+** (si vous développez le backend)
- **PostgreSQL 14+** (base de données)
- **Nginx ou Apache** (serveur web)
- **Composer** (gestionnaire de dépendances PHP)
- **Node.js & npm** (optionnel, pour le frontend)

---

### 🍎 **Installation sur macOS**

#### 1. Installer les outils requis

**Avec Homebrew :**
```bash
# Installer Homebrew si ce n'est pas déjà fait
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Installer les dépendances
brew install git php@8.4 postgresql nginx composer node
```

#### 2. Démarrer les services

```bash
# Démarrer PostgreSQL
brew services start postgresql

# Démarrer Nginx
brew services start nginx
```

#### 3. Cloner le projet

```bash
# Naviguer vers le dossier de votre choix
cd ~/Projets

# Cloner le référentiel
git clone https://github.com/AmirBrDr/Projet-BD-PHP-Web.git
cd Projet-BD-PHP-Web
```

#### 4. Configurer la base de données locale

```bash
# Créer la base de données
createdb greenpulse

# Importer le schéma
psql greenpulse < db/schema.sql

# Créer l'utilisateur DB (optionnel)
createuser greenpulse_dev
```

#### 5. Configurer PHP localement

```bash
# Créer une configuration locale
cp api/config.php api/config.local.php

# Éditez config.local.php avec vos détails de base de données
nano api/config.local.php
```

#### 6. Exécuter le serveur local

```bash
# Depuis le dossier du projet
php -S localhost:8000 -t public/
```

Accédez à : `http://localhost:8000`

---

### 🪟 **Installation sur Windows (avec WAMP/XAMPP)**

#### 1. Installer les outils requis

**Option A : XAMPP (recommandé)**
- Téléchargez XAMPP depuis https://www.apachefriends.org/
- Installez-le (il inclut Apache, PHP, PostgreSQL, Nginx)

**Option B : Installations individuelles**
- Git : https://git-scm.com/download/win
- PHP 8.4 : https://windows.php.net/download/
- PostgreSQL : https://www.postgresql.org/download/windows/
- Nginx : https://nginx.org/en/download.html
- Composer : https://getcomposer.org/

#### 2. Ajouter PHP au PATH Windows

1. Appuyez sur `Win + X` → **Paramètres système avancés**
2. Cliquez sur **Variables d'environnement**
3. Sous **Variables utilisateur**, cliquez sur **Nouveau**
   - Nom : `PATH`
   - Valeur : `C:\xampp\php` (ou votre chemin PHP)
4. Cliquez **OK** et redémarrez

#### 3. Vérifier l'installation

Ouvrez **PowerShell** et testez :
```powershell
php -v
composer --version
git --version
```

#### 4. Cloner le projet

```powershell
# Naviguer vers le dossier de votre choix
cd C:\Projets

# Cloner le référentiel
git clone https://github.com/AmirBrDr/Projet-BD-PHP-Web.git
cd Projet-BD-PHP-Web
```

#### 5. Configurer PostgreSQL

1. Ouvrez **PostgreSQL Command Line Client** (pgAdmin)
2. Connectez-vous en tant qu'administrateur
3. Exécutez :
```sql
CREATE DATABASE greenpulse;
CREATE USER greenpulse_dev WITH PASSWORD 'password123';
GRANT ALL PRIVILEGES ON DATABASE greenpulse TO greenpulse_dev;
```

#### 6. Importer le schéma

```powershell
# Dans PowerShell, depuis le dossier du projet
psql -U greenpulse_dev -d greenpulse -f db/schema.sql
```

#### 7. Configurer PHP

```powershell
# Copier la config
Copy-Item api\config.php api\config.local.php

# Éditez avec Notepad++ ou VS Code
code api\config.local.php
```

#### 8. Exécuter le serveur local

```powershell
# Depuis le dossier du projet
php -S localhost:8000 -t public/
```

Accédez à : `http://localhost:8000`

---

### 🐧 **Installation sur Linux (Ubuntu/Debian)**

#### 1. Installer les dépendances

```bash
# Mettre à jour les paquets
sudo apt update && sudo apt upgrade -y

# Installer les outils requis
sudo apt install -y git php8.4 php8.4-pgsql postgresql postgresql-contrib nginx composer nodejs npm

# Démarrer les services
sudo systemctl start postgresql
sudo systemctl start nginx
```

#### 2. Configurer PostgreSQL

```bash
# Basculer vers l'utilisateur postgres
sudo -u postgres psql

# Dans le terminal PostgreSQL :
CREATE DATABASE greenpulse;
CREATE USER greenpulse_dev WITH ENCRYPTED PASSWORD 'password123';
GRANT ALL PRIVILEGES ON DATABASE greenpulse TO greenpulse_dev;
\q

# Importer le schéma
sudo -u postgres psql -d greenpulse -f $(pwd)/db/schema.sql
```

#### 3. Cloner le projet

```bash
# Naviguer vers le dossier de votre choix
cd ~/Projets

# Cloner le référentiel
git clone https://github.com/AmirBrDr/Projet-BD-PHP-Web.git
cd Projet-BD-PHP-Web
```

#### 4. Configurer PHP

```bash
# Copier la configuration
cp api/config.php api/config.local.php

# Éditer la configuration
nano api/config.local.php
```

#### 5. Exécuter le serveur local

```bash
# Accédez au dossier du projet
cd Projet-BD-PHP-Web

# Lancer le serveur HTTP PHP
php -S localhost:8000 -t public/
```

Accédez à : `http://localhost:8000`

---

### Configuration de la base de données locale

Modifiez `api/config.local.php` :
```php
<?php
define('DB_HOST', 'localhost');
define('DB_PORT', 5432);
define('DB_NAME', 'greenpulse');
define('DB_USER', 'greenpulse_dev');
define('DB_PASSWORD', 'votre_mot_de_passe');
?>
```

---

## Premiers pas pour les membres de l'équipe

### 1. **Développement Frontend** (HTML/CSS/JS)
Chaque page a des fichiers modèles :
- `public/pages/[pagename].html` - Modifiez la structure HTML
- `public/assets/css/[pagename].css` - Ajoutez vos styles
- `public/assets/js/[pagename].js` - Ajoutez votre JavaScript

**Exemple de flux de travail :**
```bash
cd /srv/greenpulse
# Faites vos modifications
git add .
git commit -m "feat: implémente la page dashboardRH"
git push origin main
```

### 2. **Développement Backend** (PHP/API)
Chaque module a un fichier modèle :
- `api/modules/[module]/index.php` - Ajoutez vos points de terminaison API

**Exemple de structure de point de terminaison :**
```php
<?php
// api/modules/challenges/index.php
require_once __DIR__ . '/../../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Récupère les défis
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Crée un défi
}
?>
```

### 3. **Mise à jour des routes Nginx** (Si nécessaire)
La configuration Nginx est dans `deploy/nginx/greenpulse.conf`
- Routes frontend : `/pages/` servent automatiquement HTML
- Routes API : `/api/modules/` 

---

## API et bibliothèques disponibles

### Authentification
- `api/auth/login.php` - Connexion utilisateur
- `api/auth/register.php` - Inscription utilisateur
- `api/auth/me.php` - Obtenir les informations de l'utilisateur actuel

### Bibliothèques partagées
- `api/lib/db.php` - Connexion base de données
- `api/lib/http.php` - Utilitaires HTTP
- `api/lib/jwt.php` - Gestion des jetons JWT

---

## Bonnes pratiques de développement

### ✅ À faire

- Faire des commits réguliers et descriptifs
- Créer une branche pour chaque fonctionnalité
- Tester avant de pousser
- Garder votre branche à jour avec `main`
- Écrire du code lisible et commenté

### ❌ À ne pas faire

- Committer directement sur `main`
- Pousser du code non testé
- Ignorer les erreurs de compilation
- Modifier les fichiers de configuration globaux
- Committer des mots de passe ou secrets

---

## Flux de travail complet de développement

### Étape 1 : Configuration initiale (une seule fois)

```bash
# Cloner le projet
git clone https://github.com/AmirBrDr/Projet-BD-PHP-Web.git
cd Projet-BD-PHP-Web

# Configurer vos informations Git
git config user.name "Votre Nom"
git config user.email "votre.email@example.com"

# Configurer votre branche locale pour le suivi
git branch --set-upstream-to=origin/main main
```

### Étape 2 : Avant de commencer une nouvelle fonctionnalité

```bash
# Mettre à jour votre code local
git checkout main
git pull origin main

# Créer une nouvelle branche pour votre fonctionnalité
git checkout -b feature/ma-function
```

### Étape 3 : Pendant le développement

```bash
# Voir les fichiers modifiés
git status

# Vérifier vos modifications
git diff

# Ajouter vos modifications
git add .
# ou ajouter des fichiers spécifiques
git add public/pages/dashboardRH.html

# Faire un commit descriptif
git commit -m "feat: ajoute le dashboardRH avec les statistiques principales"

# Pousser votre branche vers GitHub
git push origin feature/ma-function
```

### Étape 4 : Demander examen (Pull Request sur GitHub)

1. Allez sur https://github.com/AmirBrDr/Projet-BD-PHP-Web
2. Cliquez sur **Pull requests** → **New pull request**
3. Sélectionnez votre branche (`feature/ma-function`)
4. Décrivez vos changements détaillés
5. Cliquez **Create pull request**
6. Attendez l'examen et les commentaires de l'équipe

### Étape 5 : Répondre aux commentaires

```bash
# Si vous devez apporter des modifications :
# Faites les changements
git add .
git commit -m "fix: adresse les commentaires de révision"
git push origin feature/ma-function

# Le PR se met à jour automatiquement
```

### Étape 6 : Après l'approbation

```bash
# Revenir à main
git checkout main

# Mettre à jour main
git pull origin main

# Supprimer votre branche (optionnel)
git branch -d feature/ma-function
git push origin --delete feature/ma-function
```

---

## Commandes Git essentielles

| Commande | Description |
|----------|-------------|
| `git status` | Voir les fichiers modifiés |
| `git add .` | Ajouter tous les fichiers au staging |
| `git commit -m "message"` | Créer un commit |
| `git push origin <branche>` | Pousser vers GitHub |
| `git pull origin main` | Récupérer les mises à jour |
| `git log --oneline` | Voir l'historique des commits |
| `git checkout -b <branche>` | Créer et basculer vers une branche |
| `git branch -a` | Voir toutes les branches |
| `git diff` | Voir les modifications |
| `git merge <branche>` | Fusionner une branche |

---

## Dépannage courant

### Le site ne charge pas après le clonage

```bash
# 1. Vérifier que la base de données est démarrée
# macOS
brew services list

# Windows
services.msc (cherchez PostgreSQL)

# Linux
sudo systemctl status postgresql

# 2. Vérifier que le serveur PHP est en cours d'exécution
php -S localhost:8000 -t public/

# 3. Accédez à http://localhost:8000
```

### Erreur de connexion à la base de données

1. Vérifiez que PostgreSQL est démarré
2. Vérifiez les identifiants dans `api/config.local.php`
3. Testez la connexion :
   ```bash
   psql -U greenpulse_dev -d greenpulse -h localhost
   ```

### Le push échoue avec "rejected"

```bash
# Votre branche est en retard
git pull origin <votre-branche>

# Résoudre les conflits s'il y en a
# Puis pousser à nouveau
git push origin <votre-branche>
```

### J'ai fait un commit sur main par accident

```bash
# Annuler le dernier commit (garde les modifications)
git reset --soft HEAD~1

# Créer une branche et repousser correctement
git checkout -b feature/oops
git commit -m "feat: description"
git push origin feature/oops
```

---

## Base de données

Schéma situé dans : `db/schema.sql`
- Utilisez-le pour comprendre les modèles de données
- Connexion base de données disponible via `api/lib/db.php`

---

## Référence des maquettes

Maquettes UI et conceptions dans `/maquette/` :
- Templates HTML : `maquette/HTML/[pagename].html`
- Styles CSS : `maquette/CSS/[pagename].css`

Utilisez-les comme référence pour votre implémentation !

---

## Contact et support

Pour des questions ou des blocages :
- Vérifiez les problèmes existants sur GitHub
- Créez une nouvelle issue si nécessaire
- Taggez les membres de l'équipe pour examen

Bon codage ! 🚀
