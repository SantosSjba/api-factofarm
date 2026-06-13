-- Fase 9: delivery + marketing (fidelización, cupones)

CREATE TYPE "DeliveryOrderStatus" AS ENUM ('RECIBIDO', 'PREPARANDO', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO');
CREATE TYPE "DeliveryChannel" AS ENUM ('TELEFONO', 'WHATSAPP', 'WEB', 'PRESENCIAL');
CREATE TYPE "DeliveryNotificationChannel" AS ENUM ('WHATSAPP', 'SMS', 'EMAIL');
CREATE TYPE "LoyaltyTransactionType" AS ENUM ('VENTA', 'DELIVERY', 'AJUSTE', 'CANJE');

ALTER TABLE "Establishment"
  ADD COLUMN IF NOT EXISTS "deliveryWhatsappNumero" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "deliveryPublicSlug" VARCHAR(60),
  ADD COLUMN IF NOT EXISTS "deliveryPortalEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "deliveryNotifyEmailEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "deliveryNotifySmsEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "loyaltyPointsPerSol" INTEGER NOT NULL DEFAULT 1;

CREATE UNIQUE INDEX IF NOT EXISTS "Establishment_deliveryPublicSlug_key" ON "Establishment"("deliveryPublicSlug");

CREATE TABLE "DeliveryOrder" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "customerId" TEXT,
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "saleId" TEXT,
    "numero" VARCHAR(20) NOT NULL,
    "estado" "DeliveryOrderStatus" NOT NULL DEFAULT 'RECIBIDO',
    "canal" "DeliveryChannel" NOT NULL DEFAULT 'TELEFONO',
    "clienteNombre" VARCHAR(200) NOT NULL,
    "clienteTelefono" VARCHAR(30) NOT NULL,
    "clienteEmail" VARCHAR(120),
    "direccionEntrega" VARCHAR(500) NOT NULL,
    "referenciaDireccion" VARCHAR(200),
    "distritoEntrega" VARCHAR(120),
    "costoDelivery" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(18,4) NOT NULL,
    "igvTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,4) NOT NULL,
    "notasCliente" VARCHAR(500),
    "notasInternas" VARCHAR(500),
    "programadoPara" TIMESTAMP(3),
    "entregadoAt" TIMESTAMP(3),
    "cancelReason" VARCHAR(500),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeliveryOrderItem" (
    "id" TEXT NOT NULL,
    "deliveryOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "cantidad" DECIMAL(18,4) NOT NULL,
    "precioUnitario" DECIMAL(18,4) NOT NULL,
    "subtotalLinea" DECIMAL(18,4) NOT NULL,
    "igvLinea" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "totalLinea" DECIMAL(18,4) NOT NULL,
    "notas" VARCHAR(200),

    CONSTRAINT "DeliveryOrderItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeliveryNotificationLog" (
    "id" TEXT NOT NULL,
    "deliveryOrderId" TEXT NOT NULL,
    "channel" "DeliveryNotificationChannel" NOT NULL,
    "templateKey" VARCHAR(60) NOT NULL,
    "destino" VARCHAR(120) NOT NULL,
    "mensaje" VARCHAR(1000) NOT NULL,
    "enviadoOk" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryNotificationLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerLoyaltyTransaction" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "tipo" "LoyaltyTransactionType" NOT NULL,
    "puntos" INTEGER NOT NULL,
    "saldoAfter" INTEGER NOT NULL,
    "referencia" VARCHAR(120),
    "saleId" TEXT,
    "deliveryOrderId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerLoyaltyTransaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PromotionRedemption" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "customerId" TEXT,
    "saleId" TEXT,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromotionRedemption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DeliveryOrder_saleId_key" ON "DeliveryOrder"("saleId");
CREATE UNIQUE INDEX "DeliveryOrder_establishmentId_numero_key" ON "DeliveryOrder"("establishmentId", "numero");
CREATE INDEX "DeliveryOrder_establishmentId_idx" ON "DeliveryOrder"("establishmentId");
CREATE INDEX "DeliveryOrder_estado_idx" ON "DeliveryOrder"("estado");
CREATE INDEX "DeliveryOrder_customerId_idx" ON "DeliveryOrder"("customerId");
CREATE INDEX "DeliveryOrder_deletedAt_idx" ON "DeliveryOrder"("deletedAt");
CREATE INDEX "DeliveryOrderItem_deliveryOrderId_idx" ON "DeliveryOrderItem"("deliveryOrderId");
CREATE INDEX "DeliveryOrderItem_productId_idx" ON "DeliveryOrderItem"("productId");
CREATE INDEX "DeliveryNotificationLog_deliveryOrderId_idx" ON "DeliveryNotificationLog"("deliveryOrderId");
CREATE INDEX "CustomerLoyaltyTransaction_customerId_idx" ON "CustomerLoyaltyTransaction"("customerId");
CREATE INDEX "CustomerLoyaltyTransaction_establishmentId_idx" ON "CustomerLoyaltyTransaction"("establishmentId");
CREATE INDEX "CustomerLoyaltyTransaction_saleId_idx" ON "CustomerLoyaltyTransaction"("saleId");
CREATE INDEX "CustomerLoyaltyTransaction_deliveryOrderId_idx" ON "CustomerLoyaltyTransaction"("deliveryOrderId");
CREATE UNIQUE INDEX "PromotionRedemption_saleId_key" ON "PromotionRedemption"("saleId");
CREATE INDEX "PromotionRedemption_promotionId_idx" ON "PromotionRedemption"("promotionId");
CREATE INDEX "PromotionRedemption_customerId_idx" ON "PromotionRedemption"("customerId");

ALTER TABLE "DeliveryOrder" ADD CONSTRAINT "DeliveryOrder_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DeliveryOrder" ADD CONSTRAINT "DeliveryOrder_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DeliveryOrder" ADD CONSTRAINT "DeliveryOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DeliveryOrder" ADD CONSTRAINT "DeliveryOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DeliveryOrder" ADD CONSTRAINT "DeliveryOrder_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DeliveryOrder" ADD CONSTRAINT "DeliveryOrder_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DeliveryOrderItem" ADD CONSTRAINT "DeliveryOrderItem_deliveryOrderId_fkey" FOREIGN KEY ("deliveryOrderId") REFERENCES "DeliveryOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeliveryOrderItem" ADD CONSTRAINT "DeliveryOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DeliveryNotificationLog" ADD CONSTRAINT "DeliveryNotificationLog_deliveryOrderId_fkey" FOREIGN KEY ("deliveryOrderId") REFERENCES "DeliveryOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CustomerLoyaltyTransaction" ADD CONSTRAINT "CustomerLoyaltyTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerLoyaltyTransaction" ADD CONSTRAINT "CustomerLoyaltyTransaction_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomerLoyaltyTransaction" ADD CONSTRAINT "CustomerLoyaltyTransaction_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomerLoyaltyTransaction" ADD CONSTRAINT "CustomerLoyaltyTransaction_deliveryOrderId_fkey" FOREIGN KEY ("deliveryOrderId") REFERENCES "DeliveryOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomerLoyaltyTransaction" ADD CONSTRAINT "CustomerLoyaltyTransaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PromotionRedemption" ADD CONSTRAINT "PromotionRedemption_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PromotionRedemption" ADD CONSTRAINT "PromotionRedemption_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PromotionRedemption" ADD CONSTRAINT "PromotionRedemption_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
