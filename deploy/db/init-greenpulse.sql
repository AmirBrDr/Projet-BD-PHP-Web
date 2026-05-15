-- GreenPulse production bootstrap SQL
-- Execute as postgres superuser:
--   psql -f init-greenpulse.sql
-- IMPORTANT: replace CHANGE_ME_STRONG_DB_PASSWORD before first use.

-- Creation du role postgres si absent (environnements educatifs)
DO
$$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'postgres') THEN
      CREATE ROLE postgres LOGIN PASSWORD 'postgres';
   END IF;
END
$$;

-- Creation de la base greenpulse si absente
DO
$$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'greenpulse') THEN
      CREATE DATABASE greenpulse;
   END IF;
END
$$;

-- Appliquer les droits sur la base cible
\connect greenpulse

GRANT CONNECT ON DATABASE greenpulse TO postgres;
GRANT USAGE ON SCHEMA public TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO postgres;
