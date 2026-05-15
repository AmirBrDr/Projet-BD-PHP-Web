# Tests GreenPulse

Cette documentation explique comment exécuter et étendre la suite de tests unitaires du projet GreenPulse.

## Structure et Fichiers de Tests

La suite de tests est séparée entre le backend (PHP) et le frontend (JavaScript).

### 📁 Tests PHP (PHPUnit)
- `tests/php/Unit/AuthTest.php` (5 tests) : Normalisation, validation et sécurisation des rôles, tokens de reset.
- `tests/php/Unit/JwtTest.php` (6 tests) : Génération, vérification, expiration et robustesse des tokens JWT.
- `tests/php/Unit/ChallengesTest.php` (5 tests) : Récupération des défis, blocages (certains tests skippés car logique fortement couplée).
- `tests/php/Unit/PointsTest.php` (5 tests) : Calcul des niveaux, seuils, limites (points négatifs, division par zéro).
- `tests/php/Unit/DatabaseTest.php` (2 tests) : Gestion des erreurs de connexion PDO et setup de tables critiques.

### 📁 Tests JS (Jest)
- `tests/js/unit/auth.test.js` (8 tests) : Validation de la forme des emails et complexité des mots de passe.
- `tests/js/unit/2fa.test.js` (5 tests) : Validation stricts du format du code à 6 chiffres.
- `tests/js/unit/reset-password.test.js` (5 tests) : Correspondance, cases, et vérifications anti-null.
- `tests/js/unit/dashboard.test.js` (8 tests) : Calculs de pourcentage et temps restant sans division par zéro.
- `tests/js/unit/validation.test.js` (7 tests) : Utilitaires de sécurité (`safeParseJSON`, `sanitizeHTML`).
- `tests/js/unit/storage.test.js` (5 tests) : Mock complet des opérations `localStorage` pour les JWT.

## Installation des dépendances

Avant de lancer les tests, assurez-vous d'avoir installé les dépendances via Composer et NPM :

```bash
# Pour PHPUnit (PHP)
composer install

# Pour Jest (JavaScript)
npm install
```

## Lancer les tests

### PHP (Backend)

Pour lancer la suite de tests PHPUnit :
```bash
composer test
```

Pour générer un rapport de couverture de code (HTML dans `coverage/php`) :
```bash
composer test-coverage
```

### JavaScript (Frontend)

Pour lancer la suite de tests Jest :
```bash
npm test
```

Pour le mode "watch" (relance les tests à chaque modification) :
```bash
npm run test:watch
```

Pour générer un rapport de couverture de code :
```bash
npm run test:coverage
```
