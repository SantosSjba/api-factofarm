-- B-PER-17: FK opcionales ElectronicDocument → Archivo (limpia huérfanos antes de crear constraint)
UPDATE "ElectronicDocument" ed
SET "xmlArchivoId" = NULL
WHERE "xmlArchivoId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "archivos" a WHERE a.id = ed."xmlArchivoId");

UPDATE "ElectronicDocument" ed
SET "pdfArchivoId" = NULL
WHERE "pdfArchivoId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "archivos" a WHERE a.id = ed."pdfArchivoId");

UPDATE "ElectronicDocument" ed
SET "cdrArchivoId" = NULL
WHERE "cdrArchivoId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "archivos" a WHERE a.id = ed."cdrArchivoId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ElectronicDocument_xmlArchivoId_fkey'
  ) THEN
    ALTER TABLE "ElectronicDocument"
      ADD CONSTRAINT "ElectronicDocument_xmlArchivoId_fkey"
      FOREIGN KEY ("xmlArchivoId") REFERENCES "archivos"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ElectronicDocument_pdfArchivoId_fkey'
  ) THEN
    ALTER TABLE "ElectronicDocument"
      ADD CONSTRAINT "ElectronicDocument_pdfArchivoId_fkey"
      FOREIGN KEY ("pdfArchivoId") REFERENCES "archivos"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ElectronicDocument_cdrArchivoId_fkey'
  ) THEN
    ALTER TABLE "ElectronicDocument"
      ADD CONSTRAINT "ElectronicDocument_cdrArchivoId_fkey"
      FOREIGN KEY ("cdrArchivoId") REFERENCES "archivos"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
