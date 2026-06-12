-- CreateEnum
CREATE TYPE "ProductPriceField" AS ENUM ('PRECIO_VENTA', 'PRECIO_COMPRA', 'COSTO_UNITARIO', 'PRECIO_ALMACEN', 'PRESENTACION_PRECIO_1', 'PRESENTACION_PRECIO_2', 'PRESENTACION_PRECIO_3');

-- CreateEnum
CREATE TYPE "ProductPriceChangeSource" AS ENUM ('MANUAL', 'IMPORT', 'DUPLICATE');

-- CreateTable
CREATE TABLE "ProductPriceHistory" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "field" "ProductPriceField" NOT NULL,
    "warehouseId" TEXT,
    "presentationKey" VARCHAR(120),
    "previousValue" DECIMAL(18,4),
    "newValue" DECIMAL(18,4) NOT NULL,
    "changedById" TEXT,
    "source" "ProductPriceChangeSource" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductPriceHistory_productId_createdAt_idx" ON "ProductPriceHistory"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "ProductPriceHistory_warehouseId_idx" ON "ProductPriceHistory"("warehouseId");

-- CreateIndex
CREATE INDEX "ProductPriceHistory_changedById_idx" ON "ProductPriceHistory"("changedById");

-- AddForeignKey
ALTER TABLE "ProductPriceHistory" ADD CONSTRAINT "ProductPriceHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPriceHistory" ADD CONSTRAINT "ProductPriceHistory_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPriceHistory" ADD CONSTRAINT "ProductPriceHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
