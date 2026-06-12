-- CreateEnum
CREATE TYPE "InventoryValuationMethod" AS ENUM ('PEPS', 'PROMEDIO_PONDERADO');

-- CreateEnum
CREATE TYPE "InventoryPhysicalCountStatus" AS ENUM ('EN_PROCESO', 'FINALIZADO', 'ANULADO');

-- CreateEnum
CREATE TYPE "InventoryPendingAdjustmentStatus" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO');

-- AlterTable Establishment
ALTER TABLE "Establishment" ADD COLUMN "inventoryValuationMethod" "InventoryValuationMethod" NOT NULL DEFAULT 'PEPS';
ALTER TABLE "Establishment" ADD COLUMN "blockExpiredProductSales" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Establishment" ADD COLUMN "adjustmentQtyThreshold" DECIMAL(18,4) NOT NULL DEFAULT 50;

-- CreateTable InventoryPhysicalCount
CREATE TABLE "InventoryPhysicalCount" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "userId" TEXT,
    "estado" "InventoryPhysicalCountStatus" NOT NULL DEFAULT 'EN_PROCESO',
    "comentario" VARCHAR(500),
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryPhysicalCount_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InventoryPhysicalCount_warehouseId_idx" ON "InventoryPhysicalCount"("warehouseId");
CREATE INDEX "InventoryPhysicalCount_estado_idx" ON "InventoryPhysicalCount"("estado");
CREATE INDEX "InventoryPhysicalCount_deletedAt_idx" ON "InventoryPhysicalCount"("deletedAt");

ALTER TABLE "InventoryPhysicalCount" ADD CONSTRAINT "InventoryPhysicalCount_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryPhysicalCount" ADD CONSTRAINT "InventoryPhysicalCount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable InventoryPhysicalCountItem
CREATE TABLE "InventoryPhysicalCountItem" (
    "id" TEXT NOT NULL,
    "countId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "codigoLote" TEXT,
    "stockSistema" DECIMAL(18,4) NOT NULL,
    "stockContado" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "InventoryPhysicalCountItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InventoryPhysicalCountItem_countId_idx" ON "InventoryPhysicalCountItem"("countId");
CREATE INDEX "InventoryPhysicalCountItem_productId_idx" ON "InventoryPhysicalCountItem"("productId");

ALTER TABLE "InventoryPhysicalCountItem" ADD CONSTRAINT "InventoryPhysicalCountItem_countId_fkey" FOREIGN KEY ("countId") REFERENCES "InventoryPhysicalCount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryPhysicalCountItem" ADD CONSTRAINT "InventoryPhysicalCountItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable InventoryPendingAdjustment
CREATE TABLE "InventoryPendingAdjustment" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "codigoLote" TEXT,
    "cantidadAjuste" DECIMAL(18,4) NOT NULL,
    "motivo" VARCHAR(500) NOT NULL,
    "estado" "InventoryPendingAdjustmentStatus" NOT NULL DEFAULT 'PENDIENTE',
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryPendingAdjustment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InventoryPendingAdjustment_estado_idx" ON "InventoryPendingAdjustment"("estado");
CREATE INDEX "InventoryPendingAdjustment_warehouseId_idx" ON "InventoryPendingAdjustment"("warehouseId");
CREATE INDEX "InventoryPendingAdjustment_requestedById_idx" ON "InventoryPendingAdjustment"("requestedById");
CREATE INDEX "InventoryPendingAdjustment_deletedAt_idx" ON "InventoryPendingAdjustment"("deletedAt");

ALTER TABLE "InventoryPendingAdjustment" ADD CONSTRAINT "InventoryPendingAdjustment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryPendingAdjustment" ADD CONSTRAINT "InventoryPendingAdjustment_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryPendingAdjustment" ADD CONSTRAINT "InventoryPendingAdjustment_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryPendingAdjustment" ADD CONSTRAINT "InventoryPendingAdjustment_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
