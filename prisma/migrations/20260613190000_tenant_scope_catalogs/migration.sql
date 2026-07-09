-- Tenant scope for catalogs and audit/files

ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "CompoundProduct" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "CustomerZone" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "CustomerType" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "archivos" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

UPDATE "Supplier" s SET "tenantId" = t.id FROM "tenants" t WHERE t.slug = 'factofarm-demo' AND s."tenantId" IS NULL;
UPDATE "Service" s SET "tenantId" = t.id FROM "tenants" t WHERE t.slug = 'factofarm-demo' AND s."tenantId" IS NULL;
UPDATE "CompoundProduct" s SET "tenantId" = t.id FROM "tenants" t WHERE t.slug = 'factofarm-demo' AND s."tenantId" IS NULL;
UPDATE "Category" s SET "tenantId" = t.id FROM "tenants" t WHERE t.slug = 'factofarm-demo' AND s."tenantId" IS NULL;
UPDATE "Brand" s SET "tenantId" = t.id FROM "tenants" t WHERE t.slug = 'factofarm-demo' AND s."tenantId" IS NULL;
UPDATE "CustomerZone" s SET "tenantId" = t.id FROM "tenants" t WHERE t.slug = 'factofarm-demo' AND s."tenantId" IS NULL;
UPDATE "CustomerType" s SET "tenantId" = t.id FROM "tenants" t WHERE t.slug = 'factofarm-demo' AND s."tenantId" IS NULL;

UPDATE "Supplier" s SET "tenantId" = (SELECT id FROM "tenants" WHERE "deletedAt" IS NULL ORDER BY "createdAt" ASC LIMIT 1) WHERE s."tenantId" IS NULL;
UPDATE "Service" s SET "tenantId" = (SELECT id FROM "tenants" WHERE "deletedAt" IS NULL ORDER BY "createdAt" ASC LIMIT 1) WHERE s."tenantId" IS NULL;
UPDATE "CompoundProduct" s SET "tenantId" = (SELECT id FROM "tenants" WHERE "deletedAt" IS NULL ORDER BY "createdAt" ASC LIMIT 1) WHERE s."tenantId" IS NULL;
UPDATE "Category" s SET "tenantId" = (SELECT id FROM "tenants" WHERE "deletedAt" IS NULL ORDER BY "createdAt" ASC LIMIT 1) WHERE s."tenantId" IS NULL;
UPDATE "Brand" s SET "tenantId" = (SELECT id FROM "tenants" WHERE "deletedAt" IS NULL ORDER BY "createdAt" ASC LIMIT 1) WHERE s."tenantId" IS NULL;
UPDATE "CustomerZone" s SET "tenantId" = (SELECT id FROM "tenants" WHERE "deletedAt" IS NULL ORDER BY "createdAt" ASC LIMIT 1) WHERE s."tenantId" IS NULL;
UPDATE "CustomerType" s SET "tenantId" = (SELECT id FROM "tenants" WHERE "deletedAt" IS NULL ORDER BY "createdAt" ASC LIMIT 1) WHERE s."tenantId" IS NULL;

-- Backfill audit/files from user tenant
UPDATE "AuditLog" a SET "tenantId" = u."tenantId" FROM "users" u WHERE a."userId" = u.id AND a."tenantId" IS NULL AND u."tenantId" IS NOT NULL;
UPDATE "archivos" f SET "tenantId" = u."tenantId" FROM "users" u WHERE f."uploadedByUserId" = u.id AND f."tenantId" IS NULL AND u."tenantId" IS NOT NULL;

ALTER TABLE "Supplier" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Service" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "CompoundProduct" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Category" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Brand" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "CustomerZone" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "CustomerType" ALTER COLUMN "tenantId" SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Service" ADD CONSTRAINT "Service_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "CompoundProduct" ADD CONSTRAINT "CompoundProduct_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Category" ADD CONSTRAINT "Category_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Brand" ADD CONSTRAINT "Brand_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "CustomerZone" ADD CONSTRAINT "CustomerZone_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "CustomerType" ADD CONSTRAINT "CustomerType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "archivos" ADD CONSTRAINT "archivos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP INDEX IF EXISTS "Supplier_tipoDocumento_numeroDocumento_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Supplier_tenantId_tipoDocumento_numeroDocumento_key" ON "Supplier"("tenantId", "tipoDocumento", "numeroDocumento");

DROP INDEX IF EXISTS "Category_nombre_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Category_tenantId_nombre_key" ON "Category"("tenantId", "nombre");

DROP INDEX IF EXISTS "Brand_nombre_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Brand_tenantId_nombre_key" ON "Brand"("tenantId", "nombre");

DROP INDEX IF EXISTS "CustomerZone_nombre_key";
CREATE UNIQUE INDEX IF NOT EXISTS "CustomerZone_tenantId_nombre_key" ON "CustomerZone"("tenantId", "nombre");

DROP INDEX IF EXISTS "CustomerType_descripcion_key";
CREATE UNIQUE INDEX IF NOT EXISTS "CustomerType_tenantId_descripcion_key" ON "CustomerType"("tenantId", "descripcion");

CREATE INDEX IF NOT EXISTS "Supplier_tenantId_idx" ON "Supplier"("tenantId");
CREATE INDEX IF NOT EXISTS "Service_tenantId_idx" ON "Service"("tenantId");
CREATE INDEX IF NOT EXISTS "CompoundProduct_tenantId_idx" ON "CompoundProduct"("tenantId");
CREATE INDEX IF NOT EXISTS "Category_tenantId_idx" ON "Category"("tenantId");
CREATE INDEX IF NOT EXISTS "Brand_tenantId_idx" ON "Brand"("tenantId");
CREATE INDEX IF NOT EXISTS "CustomerZone_tenantId_idx" ON "CustomerZone"("tenantId");
CREATE INDEX IF NOT EXISTS "CustomerType_tenantId_idx" ON "CustomerType"("tenantId");
CREATE INDEX IF NOT EXISTS "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");
CREATE INDEX IF NOT EXISTS "archivos_tenantId_idx" ON "archivos"("tenantId");
