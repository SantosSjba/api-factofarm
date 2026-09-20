-- B-PER-11: intermediate / error states for physical count finalize
DO $$ BEGIN
  ALTER TYPE "InventoryPhysicalCountStatus" ADD VALUE 'PROCESANDO';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "InventoryPhysicalCountStatus" ADD VALUE 'ERROR';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
