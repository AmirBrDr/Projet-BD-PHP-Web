#!/bin/bash
# Initialisation de la base de données PostgreSQL pour GreenPulse
# Usage: bash db/init-postgres.sh

set -euo pipefail

# Variables
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="greenpulse"
DB_USER="postgres"
DB_PASS="postgres"  # Development password

echo "=== Initialisation de la base de données GreenPulse ==="

# Créer la base si elle n'existe pas
echo "Création de la base de données '$DB_NAME'..."
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
PGPASSWORD="$DB_PASS" psql -v ON_ERROR_STOP=1 -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"

echo "Application du schéma..."
PGPASSWORD="$DB_PASS" psql -v ON_ERROR_STOP=1 -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f db/schema.sql

echo "Application des migrations..."
for migration in db/migrations/*.sql; do
	if [ -f "$migration" ]; then
		echo " - $(basename "$migration")"
		PGPASSWORD="$DB_PASS" psql -v ON_ERROR_STOP=1 -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration"
	fi
done

# Apply seed data if present
if [ -f db/seed.sql ]; then
    echo "Application du seed (db/seed.sql)..."
	PGPASSWORD="$DB_PASS" psql -v ON_ERROR_STOP=1 -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f db/seed.sql

	echo "Vérification post-seed..."
	PGPASSWORD="$DB_PASS" psql -v ON_ERROR_STOP=1 -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<'SQL'
DO $$
DECLARE
	v_users INTEGER;
	v_employes INTEGER;
	v_orphan_employes INTEGER;
BEGIN
	SELECT COUNT(*) INTO v_users FROM Utilisateur;
	SELECT COUNT(*) INTO v_employes FROM Employe;

	SELECT COUNT(*)
	  INTO v_orphan_employes
	  FROM Employe e
 LEFT JOIN Utilisateur u ON u.id_user = e.id_employe
	 WHERE u.id_user IS NULL;

	IF v_users <> 108 THEN
		RAISE EXCEPTION 'Vérification seed échouée: Utilisateur attendu=108, obtenu=%', v_users;
	END IF;

	IF v_employes <> 101 THEN
		RAISE EXCEPTION 'Vérification seed échouée: Employe attendu=101, obtenu=%', v_employes;
	END IF;

	IF v_orphan_employes <> 0 THEN
		RAISE EXCEPTION 'Vérification seed échouée: % employé(s) sans utilisateur associé', v_orphan_employes;
	END IF;

	RAISE NOTICE 'Vérification post-seed OK (Utilisateur=%, Employe=%).', v_users, v_employes;
END
$$;
SQL
else
    echo "Aucun fichier de seed (db/seed.sql) trouve."
fi

echo "✓ Base de données initialisée avec succès!"
