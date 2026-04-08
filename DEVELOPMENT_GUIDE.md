# GreenPulse Development Guide

## Project Structure Overview

```
/srv/greenpulse/
├── api/
│   ├── auth/                 # Authentication endpoints
│   ├── lib/                  # Shared libraries (db, http, jwt)
│   ├── modules/              # Feature modules (NEW)
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
│   ├── auth.html             # Login/Register page
│   ├── pages/                # Application pages (NEW)
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
│       ├── css/              # Stylesheets (NEW)
│       ├── js/               # JavaScript files (NEW)
│       └── logo.png
└── maquette/                 # UI mockups reference
```

---

## User Roles & Pages

### 👨‍💼 **Admin RH (HR Administrator)**
- **Dashboard RH** - `public/pages/dashboardRH.html` - Overview of all system metrics
- **Gestion des Utilisateurs** - `public/pages/gestionUtilisateurs.html` - Manage users
- **Gestion des Défis** - `public/pages/gestionDefis.html` - Manage challenges
- **Modération** - `public/pages/moderation.html` - Review and moderate content
- **Paramètres** - `public/pages/parametresRH.html` - HR-specific settings

**API Modules:**
- `api/modules/admin/`
- `api/modules/users/`
- `api/modules/moderation/`
- `api/modules/settings/`

---

### 🎬 **Animateur (Animator/Organizer)**
- **Statistiques** - `public/pages/statistiques.html` - View statistics and analytics
- **Profil** - `public/pages/profil.html` - User profile
- **Paramètres** - `public/pages/parametresAnimateur.html` - Animator settings

**API Modules:**
- `api/modules/animator/`
- `api/modules/statistics/`

---

### 👥 **Employé (Employee)**
- **Dashboard** - `public/pages/dashboardE.html` - Personal dashboard
- **Équipe** - `public/pages/detailEquipe.html` - Team details and members
- **Défis** - `public/pages/defis.html` - List of available challenges
- **Classement** - `public/pages/classement.html` - Rankings/leaderboard
- **Détail Défi** - `public/pages/detailDefi.html` - Challenge details
- **Documents** - `public/pages/documents.html` - Document repository
- **Profil** - `public/pages/profil.html` - User profile

**API Modules:**
- `api/modules/employee/`
- `api/modules/challenges/`
- `api/modules/teams/`
- `api/modules/documents/`

---

## Getting Started for Team Members

### 1. **Frontend Development** (HTML/CSS/JS)
Each page has placeholder files:
- `public/pages/[pagename].html` - Edit the HTML structure
- `public/assets/css/[pagename].css` - Add your styles
- `public/assets/js/[pagename].js` - Add your JavaScript

**Example workflow:**
```bash
cd /srv/greenpulse
# Make changes
git add .
git commit -m "feat: implement dashboardRH page"
git push origin main
```

### 2. **Backend Development** (PHP/API)
Each module has a placeholder:
- `api/modules/[module]/index.php` - Add your API endpoints

**Example endpoint structure:**
```php
<?php
// api/modules/challenges/index.php
require_once __DIR__ . '/../../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get challenges
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Create challenge
}
?>
```

### 3. **Update Nginx Routes** (If needed)
Nginx configuration is in `deploy/nginx/greenpulse.conf`
- Frontend routes: `/pages/` automatically serve HTML
- API routes: `/api/modules/` 

---

## Available API & Libraries

### Authentication
- `api/auth/login.php` - User login
- `api/auth/register.php` - User registration
- `api/auth/me.php` - Get current user info

### Shared Libraries
- `api/lib/db.php` - Database connection
- `api/lib/http.php` - HTTP utilities
- `api/lib/jwt.php` - JWT token handling

---

## Development Workflow

1. **Clone repository**
   ```bash
   git clone https://github.com/AmirBrDr/Projet-BD-PHP-Web.git
   cd Projet-BD-PHP-Web
   ```

2. **Create your working branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** in the appropriate page/module

4. **Test locally** at `http://greenpulse.stri`

5. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add feature description"
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub for review

---

## Database

Schema located in: `db/schema.sql`
- Use this to understand data models
- Database connection available via `api/lib/db.php`

---

## Maquette Reference

UI mockups and designs in `/maquette/`:
- HTML templates: `maquette/HTML/[pagename].html`
- CSS styles: `maquette/CSS/[pagename].css`

Use these as reference for your implementation!

---

## Contact & Support

For questions or blockers:
- Check existing issues on GitHub
- Create a new issue if needed
- Tag team members for review

Happy coding! 🚀
