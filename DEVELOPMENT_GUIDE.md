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

## Flux de travail de développement

1. **Cloner le référentiel**
   ```bash
   git clone https://github.com/AmirBrDr/Projet-BD-PHP-Web.git
   cd Projet-BD-PHP-Web
   ```

2. **Créer votre branche de travail**
   ```bash
   git checkout -b feature/nom-de-votre-fonctionnalite
   ```

3. **Effectuez vos modifications** dans la page/module appropriée

4. **Testez localement** sur `http://greenpulse.stri`

5. **Validez et poussez**
   ```bash
   git add .
   git commit -m "feat: description de la fonctionnalité"
   git push origin feature/nom-de-votre-fonctionnalite
   ```

6. **Créez une Pull Request** sur GitHub pour examen

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
