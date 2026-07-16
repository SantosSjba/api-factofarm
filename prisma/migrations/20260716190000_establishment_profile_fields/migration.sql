-- Profile / address fields for Establishment that were in the Prisma model
-- but never introduced by prior SQL migrations.

ALTER TABLE "Establishment" ADD COLUMN IF NOT EXISTS "pais" TEXT NOT NULL DEFAULT 'PERU';
ALTER TABLE "Establishment" ADD COLUMN IF NOT EXISTS "departmentId" TEXT;
ALTER TABLE "Establishment" ADD COLUMN IF NOT EXISTS "provinceId" TEXT;
ALTER TABLE "Establishment" ADD COLUMN IF NOT EXISTS "districtId" TEXT;
ALTER TABLE "Establishment" ADD COLUMN IF NOT EXISTS "direccionFiscal" TEXT;
ALTER TABLE "Establishment" ADD COLUMN IF NOT EXISTS "direccionComercial" TEXT;
ALTER TABLE "Establishment" ADD COLUMN IF NOT EXISTS "telefono" TEXT;
ALTER TABLE "Establishment" ADD COLUMN IF NOT EXISTS "correoContacto" TEXT;
ALTER TABLE "Establishment" ADD COLUMN IF NOT EXISTS "direccionWeb" TEXT;
ALTER TABLE "Establishment" ADD COLUMN IF NOT EXISTS "informacionAdicional" TEXT;
ALTER TABLE "Establishment" ADD COLUMN IF NOT EXISTS "urlImpresora" TEXT;
ALTER TABLE "Establishment" ADD COLUMN IF NOT EXISTS "nombreImpresora" TEXT;
ALTER TABLE "Establishment" ADD COLUMN IF NOT EXISTS "clienteDefault" TEXT;
ALTER TABLE "Establishment" ADD COLUMN IF NOT EXISTS "logoArchivoId" TEXT;
ALTER TABLE "Establishment" ADD COLUMN IF NOT EXISTS "sujetoIgv31556" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Establishment" ADD COLUMN IF NOT EXISTS "esHospital" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Establishment" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "Establishment_codigo_key" ON "Establishment"("codigo");
CREATE INDEX IF NOT EXISTS "Establishment_departmentId_idx" ON "Establishment"("departmentId");
CREATE INDEX IF NOT EXISTS "Establishment_provinceId_idx" ON "Establishment"("provinceId");
CREATE INDEX IF NOT EXISTS "Establishment_districtId_idx" ON "Establishment"("districtId");
CREATE INDEX IF NOT EXISTS "Establishment_deletedAt_idx" ON "Establishment"("deletedAt");

DO $$ BEGIN
  ALTER TABLE "Establishment" ADD CONSTRAINT "Establishment_departmentId_fkey"
    FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Establishment" ADD CONSTRAINT "Establishment_provinceId_fkey"
    FOREIGN KEY ("provinceId") REFERENCES "provinces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Establishment" ADD CONSTRAINT "Establishment_districtId_fkey"
    FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Establishment" ADD CONSTRAINT "Establishment_logoArchivoId_fkey"
    FOREIGN KEY ("logoArchivoId") REFERENCES "archivos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
