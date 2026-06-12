-- Fase 2 PRO: método de asignación de lotes (FEFO/FIFO) por establecimiento
CREATE TYPE "InventoryLotAllocationMethod" AS ENUM ('FEFO', 'FIFO');

ALTER TABLE "Establishment"
  ADD COLUMN "inventoryLotAllocationMethod" "InventoryLotAllocationMethod" NOT NULL DEFAULT 'FEFO';
