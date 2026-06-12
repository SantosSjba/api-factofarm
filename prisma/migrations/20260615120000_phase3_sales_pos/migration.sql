-- Fase 3: Ventas, POS y caja
CREATE TYPE "SaleStatus" AS ENUM ('COMPLETADA', 'ANULADA', 'PARCIALMENTE_DEVUELTA');
CREATE TYPE "SaleDocumentType" AS ENUM ('BOLETA', 'FACTURA', 'NOTA_VENTA', 'TICKET');
CREATE TYPE "PaymentMethod" AS ENUM ('EFECTIVO', 'TARJETA', 'YAPE', 'PLIN', 'TRANSFERENCIA', 'CREDITO', 'MIXTO');
CREATE TYPE "DiscountType" AS ENUM ('PORCENTAJE', 'MONTO_FIJO');
CREATE TYPE "CashSessionStatus" AS ENUM ('ABIERTA', 'CERRADA');
CREATE TYPE "CashMovementType" AS ENUM ('APERTURA', 'INGRESO', 'EGRESO', 'VENTA', 'ANULACION', 'CIERRE');
CREATE TYPE "QuotationStatus" AS ENUM ('BORRADOR', 'ENVIADA', 'ACEPTADA', 'RECHAZADA', 'CONVERTIDA', 'VENCIDA');
CREATE TYPE "PromotionType" AS ENUM ('PORCENTAJE_ITEM', 'MONTO_ITEM', 'PORCENTAJE_VENTA', 'CANTIDAD_MINIMA', 'DOS_POR_UNO');

CREATE TABLE "CashRegister" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CashRegister_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CashSession" (
    "id" TEXT NOT NULL,
    "cashRegisterId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "estado" "CashSessionStatus" NOT NULL DEFAULT 'ABIERTA',
    "montoApertura" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "montoCierreSistema" DECIMAL(18,4),
    "montoCierreFisico" DECIMAL(18,4),
    "diferenciaArqueo" DECIMAL(18,4),
    "notasCierre" VARCHAR(500),
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    CONSTRAINT "CashSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "codigo" VARCHAR(40) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "tipo" "PromotionType" NOT NULL,
    "valor" DECIMAL(18,4) NOT NULL,
    "cantidadMinima" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerProductPrice" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "precio" DECIMAL(18,4) NOT NULL,
    CONSTRAINT "CustomerProductPrice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "cashSessionId" TEXT,
    "customerId" TEXT,
    "sellerId" TEXT NOT NULL,
    "quotationId" TEXT,
    "documentType" "SaleDocumentType" NOT NULL DEFAULT 'BOLETA',
    "serie" VARCHAR(10),
    "numero" VARCHAR(20),
    "estado" "SaleStatus" NOT NULL DEFAULT 'COMPLETADA',
    "subtotal" DECIMAL(18,4) NOT NULL,
    "descuentoTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "igvTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,4) NOT NULL,
    "saleDiscountType" "DiscountType",
    "saleDiscountValue" DECIMAL(18,4),
    "promotionCode" VARCHAR(40),
    "idempotencyKey" VARCHAR(64),
    "prescriptionValidated" BOOLEAN NOT NULL DEFAULT false,
    "prescriptionNote" VARCHAR(500),
    "voidReason" VARCHAR(500),
    "voidedById" TEXT,
    "voidedAt" TIMESTAMP(3),
    "comentario" VARCHAR(500),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "cantidad" DECIMAL(18,4) NOT NULL,
    "precioUnitario" DECIMAL(18,4) NOT NULL,
    "discountType" "DiscountType",
    "discountValue" DECIMAL(18,4),
    "subtotalLinea" DECIMAL(18,4) NOT NULL,
    "igvLinea" DECIMAL(18,4) NOT NULL,
    "totalLinea" DECIMAL(18,4) NOT NULL,
    "promotionLabel" VARCHAR(120),
    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SaleItemLot" (
    "id" TEXT NOT NULL,
    "saleItemId" TEXT NOT NULL,
    "codigoLote" VARCHAR(120) NOT NULL,
    "cantidad" DECIMAL(18,4) NOT NULL,
    CONSTRAINT "SaleItemLot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "metodo" "PaymentMethod" NOT NULL,
    "monto" DECIMAL(18,4) NOT NULL,
    "referencia" VARCHAR(120),
    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CashMovement" (
    "id" TEXT NOT NULL,
    "cashSessionId" TEXT NOT NULL,
    "tipo" "CashMovementType" NOT NULL,
    "monto" DECIMAL(18,4) NOT NULL,
    "metodoPago" "PaymentMethod",
    "referencia" VARCHAR(120),
    "comentario" VARCHAR(500),
    "saleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CashMovement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SaleReturn" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "motivo" VARCHAR(500) NOT NULL,
    "totalDevuelto" DECIMAL(18,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SaleReturn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SaleReturnItem" (
    "id" TEXT NOT NULL,
    "saleReturnId" TEXT NOT NULL,
    "saleItemId" TEXT NOT NULL,
    "cantidad" DECIMAL(18,4) NOT NULL,
    "codigoLote" VARCHAR(120),
    CONSTRAINT "SaleReturnItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "customerId" TEXT,
    "sellerId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "estado" "QuotationStatus" NOT NULL DEFAULT 'BORRADOR',
    "validezDias" INTEGER NOT NULL DEFAULT 7,
    "subtotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "descuentoTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "igvTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "comentario" VARCHAR(500),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuotationItem" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "cantidad" DECIMAL(18,4) NOT NULL,
    "precioUnitario" DECIMAL(18,4) NOT NULL,
    "discountType" "DiscountType",
    "discountValue" DECIMAL(18,4),
    "subtotalLinea" DECIMAL(18,4) NOT NULL,
    "igvLinea" DECIMAL(18,4) NOT NULL,
    "totalLinea" DECIMAL(18,4) NOT NULL,
    CONSTRAINT "QuotationItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Promotion_establishmentId_codigo_key" ON "Promotion"("establishmentId", "codigo");
CREATE INDEX "Promotion_establishmentId_idx" ON "Promotion"("establishmentId");
CREATE INDEX "Promotion_deletedAt_idx" ON "Promotion"("deletedAt");

CREATE UNIQUE INDEX "CustomerProductPrice_customerId_productId_key" ON "CustomerProductPrice"("customerId", "productId");
CREATE INDEX "CustomerProductPrice_productId_idx" ON "CustomerProductPrice"("productId");

CREATE UNIQUE INDEX "Sale_quotationId_key" ON "Sale"("quotationId");
CREATE UNIQUE INDEX "Sale_idempotencyKey_key" ON "Sale"("idempotencyKey");
CREATE INDEX "Sale_establishmentId_idx" ON "Sale"("establishmentId");
CREATE INDEX "Sale_warehouseId_idx" ON "Sale"("warehouseId");
CREATE INDEX "Sale_customerId_idx" ON "Sale"("customerId");
CREATE INDEX "Sale_sellerId_idx" ON "Sale"("sellerId");
CREATE INDEX "Sale_estado_idx" ON "Sale"("estado");
CREATE INDEX "Sale_createdAt_idx" ON "Sale"("createdAt");
CREATE INDEX "Sale_deletedAt_idx" ON "Sale"("deletedAt");

CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");
CREATE INDEX "SaleItem_productId_idx" ON "SaleItem"("productId");
CREATE INDEX "SaleItemLot_saleItemId_idx" ON "SaleItemLot"("saleItemId");
CREATE INDEX "Payment_saleId_idx" ON "Payment"("saleId");

CREATE INDEX "CashRegister_establishmentId_idx" ON "CashRegister"("establishmentId");
CREATE INDEX "CashRegister_deletedAt_idx" ON "CashRegister"("deletedAt");
CREATE INDEX "CashSession_cashRegisterId_idx" ON "CashSession"("cashRegisterId");
CREATE INDEX "CashSession_userId_idx" ON "CashSession"("userId");
CREATE INDEX "CashSession_estado_idx" ON "CashSession"("estado");
CREATE INDEX "CashMovement_cashSessionId_idx" ON "CashMovement"("cashSessionId");
CREATE INDEX "CashMovement_saleId_idx" ON "CashMovement"("saleId");

CREATE INDEX "SaleReturn_saleId_idx" ON "SaleReturn"("saleId");
CREATE INDEX "SaleReturnItem_saleReturnId_idx" ON "SaleReturnItem"("saleReturnId");

CREATE INDEX "Quotation_establishmentId_idx" ON "Quotation"("establishmentId");
CREATE INDEX "Quotation_estado_idx" ON "Quotation"("estado");
CREATE INDEX "Quotation_deletedAt_idx" ON "Quotation"("deletedAt");
CREATE INDEX "QuotationItem_quotationId_idx" ON "QuotationItem"("quotationId");
CREATE INDEX "QuotationItem_productId_idx" ON "QuotationItem"("productId");

ALTER TABLE "CashRegister" ADD CONSTRAINT "CashRegister_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashSession" ADD CONSTRAINT "CashSession_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES "CashRegister"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashSession" ADD CONSTRAINT "CashSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomerProductPrice" ADD CONSTRAINT "CustomerProductPrice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerProductPrice" ADD CONSTRAINT "CustomerProductPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "CashSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_voidedById_fkey" FOREIGN KEY ("voidedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaleItemLot" ADD CONSTRAINT "SaleItemLot_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "CashSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SaleReturn" ADD CONSTRAINT "SaleReturn_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaleReturn" ADD CONSTRAINT "SaleReturn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaleReturnItem" ADD CONSTRAINT "SaleReturnItem_saleReturnId_fkey" FOREIGN KEY ("saleReturnId") REFERENCES "SaleReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
