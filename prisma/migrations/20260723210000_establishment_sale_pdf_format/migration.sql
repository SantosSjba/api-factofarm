-- Formato PDF interno de ventas/notas por establecimiento (cliente SaaS).

DO $$ BEGIN
  CREATE TYPE "SalePdfFormat" AS ENUM ('TICKET_80', 'TICKET_58', 'A4');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Establishment"
  ADD COLUMN IF NOT EXISTS "salePdfFormat" "SalePdfFormat" NOT NULL DEFAULT 'TICKET_80';
