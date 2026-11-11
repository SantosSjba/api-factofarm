-- Las licencias farmacéuticas (CQP) no tenían cliente: cualquier cliente podía verlas o editarlas.
ALTER TABLE "PharmacistLicense" ADD COLUMN "tenantId" TEXT;

-- Cliente por el usuario vinculado a la licencia…
UPDATE "PharmacistLicense" pl
SET "tenantId" = u."tenantId"
FROM "users" u
WHERE pl."userId" = u."id" AND pl."tenantId" IS NULL;

-- …o por el establecimiento que la tiene como titular.
UPDATE "PharmacistLicense" pl
SET "tenantId" = e."tenantId"
FROM "Establishment" e
WHERE e."titularPharmacistLicenseId" = pl."id" AND pl."tenantId" IS NULL;

CREATE INDEX "PharmacistLicense_tenantId_idx" ON "PharmacistLicense"("tenantId");

ALTER TABLE "PharmacistLicense" ADD CONSTRAINT "PharmacistLicense_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
