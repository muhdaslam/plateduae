-- Runs once on first container start (mounted into
-- /docker-entrypoint-initdb.d). Extensions only — table creation is owned
-- by Drizzle migrations (packages/db/migrations), which assume these
-- already exist.
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
