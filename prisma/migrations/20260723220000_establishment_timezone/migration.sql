-- Zona horaria configurable por cliente SaaS / establecimiento (default América/Lima).
ALTER TABLE "tenants"
ADD COLUMN IF NOT EXISTS "defaultTimeZone" VARCHAR(64) NOT NULL DEFAULT 'America/Lima';

ALTER TABLE "establishments"
ADD COLUMN IF NOT EXISTS "timeZone" VARCHAR(64) NOT NULL DEFAULT 'America/Lima';
