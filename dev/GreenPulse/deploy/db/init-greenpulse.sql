-- GreenPulse production bootstrap SQL
-- Execute as postgres superuser:
--   psql -f init-greenpulse.sql
-- IMPORTANT: replace CHANGE_ME_STRONG_DB_PASSWORD before first use.

DO
$$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'greenpulse_app') THEN
      CREATE ROLE greenpulse_app LOGIN PASSWORD 'CHANGE_ME_STRONG_DB_PASSWORD';
   END IF;
END
$$;

DO
$$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'greenpulse') THEN
      CREATE DATABASE greenpulse;
   END IF;
END
$$;

\connect greenpulse

GRANT CONNECT ON DATABASE greenpulse TO greenpulse_app;
GRANT USAGE ON SCHEMA public TO greenpulse_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO greenpulse_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO greenpulse_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO greenpulse_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO greenpulse_app;
