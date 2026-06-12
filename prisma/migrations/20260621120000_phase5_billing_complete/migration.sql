-- AlterTable
ALTER TABLE "EstablishmentBillingConfig" ADD COLUMN "consultaApiUrl" VARCHAR(500);
ALTER TABLE "EstablishmentBillingConfig" ADD COLUMN "emitNotaVenta" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "EstablishmentBillingConfig" ADD COLUMN "applyDetraccion" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "EstablishmentBillingConfig" ADD COLUMN "autoEmitGuiaOnTransfer" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "ElectronicDocument" ADD COLUMN "inventoryTransferId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ElectronicDocument_inventoryTransferId_key" ON "ElectronicDocument"("inventoryTransferId");

-- AddForeignKey
ALTER TABLE "ElectronicDocument" ADD CONSTRAINT "ElectronicDocument_inventoryTransferId_fkey" FOREIGN KEY ("inventoryTransferId") REFERENCES "InventoryStockTransfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
