-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('INGRESO', 'SALIDA', 'AJUSTE', 'TRANSFERENCIA_ENTRADA', 'TRANSFERENCIA_SALIDA');

-- CreateEnum
CREATE TYPE "WarehouseZoneType" AS ENUM ('NORMAL', 'REFRIGERADO', 'CONTROLADO');

-- CreateEnum
CREATE TYPE "InventoryTransferStatus" AS ENUM ('BORRADOR', 'EN_TRANSITO', 'RECIBIDO', 'ANULADO');

-- AlterTable ProductLotStock
ALTER TABLE "ProductLotStock" ADD COLUMN "costoUnitario" DECIMAL(18,4);

-- AlterTable InventoryInboundMovement
ALTER TABLE "InventoryInboundMovement" ADD COLUMN "movementType" "InventoryMovementType" NOT NULL DEFAULT 'INGRESO';
ALTER TABLE "InventoryInboundMovement" ADD COLUMN "costoUnitario" DECIMAL(18,4);
ALTER TABLE "InventoryInboundMovement" ADD COLUMN "referencia" VARCHAR(120);
ALTER TABLE "InventoryInboundMovement" ADD COLUMN "userId" TEXT;

UPDATE "InventoryInboundMovement" SET "movementType" = 'SALIDA' WHERE "cantidad" < 0;

CREATE INDEX "InventoryInboundMovement_movementType_idx" ON "InventoryInboundMovement"("movementType");
CREATE INDEX "InventoryInboundMovement_userId_idx" ON "InventoryInboundMovement"("userId");

ALTER TABLE "InventoryInboundMovement" ADD CONSTRAINT "InventoryInboundMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable WarehouseZone
CREATE TABLE "WarehouseZone" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "WarehouseZoneType" NOT NULL DEFAULT 'NORMAL',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarehouseZone_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WarehouseZone_warehouseId_nombre_key" ON "WarehouseZone"("warehouseId", "nombre");
CREATE INDEX "WarehouseZone_warehouseId_idx" ON "WarehouseZone"("warehouseId");
CREATE INDEX "WarehouseZone_deletedAt_idx" ON "WarehouseZone"("deletedAt");

ALTER TABLE "WarehouseZone" ADD CONSTRAINT "WarehouseZone_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable ColdChainTemperatureLog
CREATE TABLE "ColdChainTemperatureLog" (
    "id" TEXT NOT NULL,
    "warehouseZoneId" TEXT NOT NULL,
    "userId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "temperaturaCelsius" DECIMAL(5,2) NOT NULL,
    "observacion" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ColdChainTemperatureLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ColdChainTemperatureLog_warehouseZoneId_idx" ON "ColdChainTemperatureLog"("warehouseZoneId");
CREATE INDEX "ColdChainTemperatureLog_fecha_idx" ON "ColdChainTemperatureLog"("fecha");
CREATE INDEX "ColdChainTemperatureLog_userId_idx" ON "ColdChainTemperatureLog"("userId");

ALTER TABLE "ColdChainTemperatureLog" ADD CONSTRAINT "ColdChainTemperatureLog_warehouseZoneId_fkey" FOREIGN KEY ("warehouseZoneId") REFERENCES "WarehouseZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ColdChainTemperatureLog" ADD CONSTRAINT "ColdChainTemperatureLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable InventoryStockTransfer
CREATE TABLE "InventoryStockTransfer" (
    "id" TEXT NOT NULL,
    "fromWarehouseId" TEXT NOT NULL,
    "toWarehouseId" TEXT NOT NULL,
    "userId" TEXT,
    "estado" "InventoryTransferStatus" NOT NULL DEFAULT 'BORRADOR',
    "guiaNumero" VARCHAR(30),
    "comentario" VARCHAR(500),
    "fechaEnvio" TIMESTAMP(3),
    "fechaRecepcion" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryStockTransfer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InventoryStockTransfer_fromWarehouseId_idx" ON "InventoryStockTransfer"("fromWarehouseId");
CREATE INDEX "InventoryStockTransfer_toWarehouseId_idx" ON "InventoryStockTransfer"("toWarehouseId");
CREATE INDEX "InventoryStockTransfer_estado_idx" ON "InventoryStockTransfer"("estado");
CREATE INDEX "InventoryStockTransfer_deletedAt_idx" ON "InventoryStockTransfer"("deletedAt");

ALTER TABLE "InventoryStockTransfer" ADD CONSTRAINT "InventoryStockTransfer_fromWarehouseId_fkey" FOREIGN KEY ("fromWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryStockTransfer" ADD CONSTRAINT "InventoryStockTransfer_toWarehouseId_fkey" FOREIGN KEY ("toWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryStockTransfer" ADD CONSTRAINT "InventoryStockTransfer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable InventoryStockTransferItem
CREATE TABLE "InventoryStockTransferItem" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "codigoLote" TEXT,
    "cantidad" DECIMAL(18,4) NOT NULL,
    "costoUnitario" DECIMAL(18,4),

    CONSTRAINT "InventoryStockTransferItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InventoryStockTransferItem_transferId_idx" ON "InventoryStockTransferItem"("transferId");
CREATE INDEX "InventoryStockTransferItem_productId_idx" ON "InventoryStockTransferItem"("productId");

ALTER TABLE "InventoryStockTransferItem" ADD CONSTRAINT "InventoryStockTransferItem_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "InventoryStockTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryStockTransferItem" ADD CONSTRAINT "InventoryStockTransferItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
