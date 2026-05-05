-- CreateTable
CREATE TABLE "InventoryTransferReason" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryTransferReason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryInboundMovement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "transferReasonId" TEXT NOT NULL,
    "cantidad" DECIMAL(18,4) NOT NULL,
    "codigoLote" TEXT,
    "fechaVencimiento" TIMESTAMP(3),
    "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comentario" VARCHAR(500),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryInboundMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InventoryTransferReason_codigo_key" ON "InventoryTransferReason"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryTransferReason_nombre_key" ON "InventoryTransferReason"("nombre");

-- CreateIndex
CREATE INDEX "InventoryTransferReason_deletedAt_idx" ON "InventoryTransferReason"("deletedAt");

-- CreateIndex
CREATE INDEX "InventoryInboundMovement_productId_idx" ON "InventoryInboundMovement"("productId");

-- CreateIndex
CREATE INDEX "InventoryInboundMovement_warehouseId_idx" ON "InventoryInboundMovement"("warehouseId");

-- CreateIndex
CREATE INDEX "InventoryInboundMovement_transferReasonId_idx" ON "InventoryInboundMovement"("transferReasonId");

-- CreateIndex
CREATE INDEX "InventoryInboundMovement_fechaRegistro_idx" ON "InventoryInboundMovement"("fechaRegistro");

-- CreateIndex
CREATE INDEX "InventoryInboundMovement_deletedAt_idx" ON "InventoryInboundMovement"("deletedAt");

-- AddForeignKey
ALTER TABLE "InventoryInboundMovement" ADD CONSTRAINT "InventoryInboundMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryInboundMovement" ADD CONSTRAINT "InventoryInboundMovement_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryInboundMovement" ADD CONSTRAINT "InventoryInboundMovement_transferReasonId_fkey" FOREIGN KEY ("transferReasonId") REFERENCES "InventoryTransferReason"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
