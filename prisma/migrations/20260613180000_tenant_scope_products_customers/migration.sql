-- AlterTable (idempotent: prior failed run may have added columns)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- Backfill tenantId on products and customers from demo tenant (slug factofarm-demo)
UPDATE "Product" p
SET "tenantId" = t.id
FROM "tenants" t
WHERE t.slug = 'factofarm-demo' AND p."tenantId" IS NULL;

UPDATE "Customer" c
SET "tenantId" = t.id
FROM "tenants" t
WHERE t.slug = 'factofarm-demo' AND c."tenantId" IS NULL;

-- Fallback: first active tenant if demo slug missing
UPDATE "Product" p
SET "tenantId" = (SELECT id FROM "tenants" WHERE "deletedAt" IS NULL ORDER BY "createdAt" ASC LIMIT 1)
WHERE p."tenantId" IS NULL;

UPDATE "Customer" c
SET "tenantId" = (SELECT id FROM "tenants" WHERE "deletedAt" IS NULL ORDER BY "createdAt" ASC LIMIT 1)
WHERE c."tenantId" IS NULL;

ALTER TABLE "Product" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Customer" ALTER COLUMN "tenantId" SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE "Product" ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Customer" ADD CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP INDEX IF EXISTS "Customer_tipoDocumento_numeroDocumento_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_tenantId_tipoDocumento_numeroDocumento_key" ON "Customer"("tenantId", "tipoDocumento", "numeroDocumento");

CREATE INDEX IF NOT EXISTS "Product_tenantId_idx" ON "Product"("tenantId");
CREATE INDEX IF NOT EXISTS "Customer_tenantId_idx" ON "Customer"("tenantId");
