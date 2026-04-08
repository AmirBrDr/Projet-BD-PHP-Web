# GreenPulse - Déploiement production avec Nginx

Ce guide implémente une mise en production de GreenPulse avec **Nginx + PHP-FPM + PostgreSQL**.

## 1) Préparer le serveur (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install -y nginx postgresql postgresql-client php8.2-fpm php8.2-cli php8.2-pgsql openssl certbot python3-certbot-nginx
```

## 2) Déployer le code

Exemple de chemin d'application attendu :

```text
/srv/greenpulse
```

Créer un utilisateur de déploiement (optionnel mais recommandé) :

```bash
sudo adduser --system --group --home /srv/greenpulse deploy
```

Ajuster ensuite les permissions (voir section 6).

### Modèle d'utilisateurs recommandé

- `postgres` : administration PostgreSQL et import du schéma.
- `deploy` : propriétaire des fichiers applicatifs (`/srv/greenpulse`).
- `www-data` : exécution Nginx + PHP-FPM (lecture uniquement sur l'app).

## 3) Initialiser PostgreSQL

### 3.1 Créer la base et l'utilisateur dédié

```bash
sudo -u postgres psql
```

Puis :

```sql
CREATE DATABASE greenpulse;
CREATE USER greenpulse_app WITH ENCRYPTED PASSWORD 'CHANGE_ME_STRONG_DB_PASSWORD';
GRANT CONNECT ON DATABASE greenpulse TO greenpulse_app;
\c greenpulse
GRANT USAGE ON SCHEMA public TO greenpulse_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO greenpulse_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO greenpulse_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO greenpulse_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO greenpulse_app;
```

### 3.2 Importer le schéma (choisir une seule méthode)

```bash
sudo -u postgres psql -d greenpulse -f /srv/greenpulse/db/schema.sql
```

Vous pouvez aussi utiliser le template SQL :

```bash
sudo -u postgres psql -f /srv/greenpulse/deploy/db/init-greenpulse.sql
```

Recommandation :
- **Méthode A (contrôle fin)** : section 3.1 puis import `schema.sql`.
- **Méthode B (rapide)** : `init-greenpulse.sql` uniquement.

Évitez d'exécuter les deux workflows en boucle : cela n'endommage pas la base, mais applique les mêmes droits plusieurs fois et complique le dépannage.

## 4) Configurer les variables d'environnement

Copier le template :

```bash
sudo cp /srv/greenpulse/deploy/env/greenpulse.env.example /etc/default/greenpulse
sudo nano /etc/default/greenpulse
```

⚠️ En production :
- définir un `GP_JWT_SECRET` long et aléatoire,
- garder `GP_DEBUG=false`,
- limiter `GP_CORS_ORIGIN` à votre domaine.

## 5) Configurer PHP-FPM (pool dédié)

```bash
sudo cp /srv/greenpulse/deploy/php-fpm/greenpulse.conf /etc/php/8.2/fpm/pool.d/greenpulse.conf
```

Dans `/etc/php/8.2/fpm/pool.d/greenpulse.conf`, ajuster :
- `user` / `group`,
- le chemin d'app,
- le socket `listen`.

Pour injecter les variables d'environnement dans PHP-FPM :

```bash
sudo systemctl edit php8.2-fpm
```

Ajouter :

```ini
[Service]
EnvironmentFile=/etc/default/greenpulse
```

Puis recharger :

```bash
sudo systemctl daemon-reload
sudo systemctl restart php8.2-fpm
```

## 6) Configurer Nginx (virtual host)

```bash
sudo cp /srv/greenpulse/deploy/nginx/greenpulse.conf /etc/nginx/sites-available/greenpulse
sudo ln -s /etc/nginx/sites-available/greenpulse /etc/nginx/sites-enabled/greenpulse
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Le fichier Nginx fourni :
- sert le front statique depuis `public/`,
- route `/`, `/login`, `/register` vers `public/auth.html`,
- sert `/assets/...` en statique,
- route `/api/...` vers PHP-FPM sous `api/`,
- bloque les fichiers sensibles.

## 7) Permissions fichiers

Exemple sécurisé :

```bash
sudo chown -R deploy:www-data /srv/greenpulse
sudo find /srv/greenpulse -type d -exec chmod 750 {} \;
sudo find /srv/greenpulse -type f -exec chmod 640 {} \;
```

## 8) HTTPS (Let's Encrypt)

Après pointage DNS vers le serveur :

```bash
sudo certbot --nginx -d your-domain.tld -d www.your-domain.tld
```

Le fichier Nginx inclut déjà une redirection HTTP → HTTPS.

## 9) Validation post-déploiement

1. Ouvrir `https://your-domain.tld/` et vérifier l'affichage de `auth.html`.
2. Tester `POST /api/auth/register.php`.
3. Tester `POST /api/auth/login.php`.
4. Vérifier l'écriture en base :
   ```bash
   sudo -u postgres psql -d greenpulse -c "SELECT COUNT(*) FROM utilisateur;"
   ```
5. En cas d'erreur :
   ```bash
   sudo tail -f /var/log/nginx/error.log
   sudo journalctl -u php8.2-fpm -f
   ```

## Important

Le fichier `api/config.local.php` est un fichier de debug local. **Ne pas l'utiliser en production**.
