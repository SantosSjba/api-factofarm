-- CreateTable
CREATE TABLE "ProductLotStock" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "codigoLote" TEXT NOT NULL,
    "stock" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "fechaVencimiento" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductLotStock_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "ProductSerial" ADD COLUMN "warehouseId" TEXT;

-- Backfill warehouseId for existing rows using first active warehouse
UPDATE "ProductSerial"
SET "warehouseId" = (
  SELECT w."id"
  FROM "Warehouse" w
  WHERE w."deletedAt" IS NULL
  ORDER BY w."createdAt" ASC
  LIMIT 1
)
WHERE "warehouseId" IS NULL;

-- Set NOT NULL
ALTER TABLE "ProductSerial" ALTER COLUMN "warehouseId" SET NOT NULL;

-- DropIndex
DROP INDEX IF EXISTS "ProductSerial_serie_key";

-- CreateIndex
CREATE INDEX "ProductSerial_warehouseId_idx" ON "ProductSerial"("warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSerial_warehouseId_serie_key" ON "ProductSerial"("warehouseId", "serie");

-- CreateIndex
CREATE INDEX "ProductLotStock_productId_idx" ON "ProductLotStock"("productId");

-- CreateIndex
CREATE INDEX "ProductLotStock_warehouseId_idx" ON "ProductLotStock"("warehouseId");

-- CreateIndex
CREATE INDEX "ProductLotStock_deletedAt_idx" ON "ProductLotStock"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductLotStock_productId_warehouseId_codigoLote_key" ON "ProductLotStock"("productId", "warehouseId", "codigoLote");

-- AddForeignKey
ALTER TABLE "ProductSerial" ADD CONSTRAINT "ProductSerial_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductLotStock" ADD CONSTRAINT "ProductLotStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductLotStock" ADD CONSTRAINT "ProductLotStock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
