-- Fase 9: hardware POS por caja / terminal

CREATE TYPE "PosPrinterPaperWidth" AS ENUM ('MM_58', 'MM_80');

ALTER TABLE "CashRegister"
  ADD COLUMN IF NOT EXISTS "printerPaperWidth" "PosPrinterPaperWidth" NOT NULL DEFAULT 'MM_80',
  ADD COLUMN IF NOT EXISTS "printerAutoPrint" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "openCashDrawerOnPrint" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "barcodeWedgeEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "customerDisplayEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "escposPrinterName" VARCHAR(120);
