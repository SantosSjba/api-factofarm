-- Fase 3 cold storage: marcar hot path + tablas archive (sin DELETE de negocio)
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
ALTER TABLE "InventoryInboundMovement" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Sale_archivedAt_idx" ON "Sale"("archivedAt");
CREATE INDEX IF NOT EXISTS "Sale_establishmentId_archivedAt_createdAt_idx" ON "Sale"("establishmentId", "archivedAt", "createdAt");
CREATE INDEX IF NOT EXISTS "InventoryInboundMovement_archivedAt_idx" ON "InventoryInboundMovement"("archivedAt");
CREATE INDEX IF NOT EXISTS "InventoryInboundMovement_warehouseId_archivedAt_fechaRegistro_idx" ON "InventoryInboundMovement"("warehouseId", "archivedAt", "fechaRegistro");

CREATE TABLE IF NOT EXISTS "ArchivedSale" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "originalCreatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,
    CONSTRAINT "ArchivedSale_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ArchivedSale_establishmentId_originalCreatedAt_idx" ON "ArchivedSale"("establishmentId", "originalCreatedAt");
CREATE INDEX IF NOT EXISTS "ArchivedSale_archivedAt_idx" ON "ArchivedSale"("archivedAt");

CREATE TABLE IF NOT EXISTS "ArchivedInventoryInboundMovement" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "originalFechaRegistro" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,
    CONSTRAINT "ArchivedInventoryInboundMovement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ArchivedInventoryInboundMovement_warehouseId_originalFechaRegistro_idx" ON "ArchivedInventoryInboundMovement"("warehouseId", "originalFechaRegistro");
CREATE INDEX IF NOT EXISTS "ArchivedInventoryInboundMovement_productId_originalFechaRegistro_idx" ON "ArchivedInventoryInboundMovement"("productId", "originalFechaRegistro");
CREATE INDEX IF NOT EXISTS "ArchivedInventoryInboundMovement_archivedAt_idx" ON "ArchivedInventoryInboundMovement"("archivedAt");
