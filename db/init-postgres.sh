#!/bin/bash
# Initialisation de la base de données PostgreSQL pour GreenPulse
# Usage: bash db/init-postgres.sh

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
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"

echo "Application du schéma..."
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f db/schema.sql

echo "Application des migrations..."
for migration in db/migrations/*.sql; do
	if [ -f "$migration" ]; then
		echo " - $(basename "$migration")"
		PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration"
	fi
done

# Apply seed data if present
if [ -f db/seed.sql ]; then
    echo "Application du seed (db/seed.sql)..."
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f db/seed.sql
else
    echo "Aucun fichier de seed (db/seed.sql) trouve."
fi

echo "✓ Base de données initialisée avec succès!"
