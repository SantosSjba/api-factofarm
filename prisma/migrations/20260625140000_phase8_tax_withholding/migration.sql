-- Fase 8: retenciones, percepciones, detracciones

CREATE TYPE "TaxWithholdingKind" AS ENUM ('RETENCION', 'PERCEPCION', 'DETRACCION');
CREATE TYPE "TaxPartyType" AS ENUM ('CLIENTE', 'PROVEEDOR');

CREATE TABLE "SunatWithholdingRate" (
    "id" TEXT NOT NULL,
    "codigo" VARCHAR(10) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "kind" "TaxWithholdingKind" NOT NULL,
    "tasa" DECIMAL(9,4) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SunatWithholdingRate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaxWithholdingRecord" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "kind" "TaxWithholdingKind" NOT NULL,
    "partyType" "TaxPartyType" NOT NULL,
    "partyId" TEXT,
    "partyNombre" VARCHAR(200) NOT NULL,
    "partyDocType" VARCHAR(20) NOT NULL,
    "partyDocNumber" VARCHAR(20) NOT NULL,
    "regimenCodigo" VARCHAR(10),
    "saleId" TEXT,
    "purchaseOrderId" TEXT,
    "electronicDocumentId" TEXT,
    "fechaOperacion" TIMESTAMP(3) NOT NULL,
    "comprobanteModificadoTipo" VARCHAR(10),
    "comprobanteModificadoSerie" VARCHAR(10),
    "comprobanteModificadoNumero" VARCHAR(20),
    "baseImponible" DECIMAL(18,4) NOT NULL,
    "tasa" DECIMAL(9,4) NOT NULL,
    "monto" DECIMAL(18,4) NOT NULL,
    "moneda" VARCHAR(3) NOT NULL DEFAULT 'PEN',
    "observaciones" VARCHAR(500),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TaxWithholdingRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SunatWithholdingRate_codigo_key" ON "SunatWithholdingRate"("codigo");
CREATE INDEX "SunatWithholdingRate_kind_activo_idx" ON "SunatWithholdingRate"("kind", "activo");

CREATE UNIQUE INDEX "TaxWithholdingRecord_electronicDocumentId_key" ON "TaxWithholdingRecord"("electronicDocumentId");
CREATE INDEX "TaxWithholdingRecord_establishmentId_kind_idx" ON "TaxWithholdingRecord"("establishmentId", "kind");
CREATE INDEX "TaxWithholdingRecord_fechaOperacion_idx" ON "TaxWithholdingRecord"("fechaOperacion");
CREATE INDEX "TaxWithholdingRecord_partyDocNumber_idx" ON "TaxWithholdingRecord"("partyDocNumber");
CREATE INDEX "TaxWithholdingRecord_deletedAt_idx" ON "TaxWithholdingRecord"("deletedAt");

ALTER TABLE "TaxWithholdingRecord" ADD CONSTRAINT "TaxWithholdingRecord_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaxWithholdingRecord" ADD CONSTRAINT "TaxWithholdingRecord_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaxWithholdingRecord" ADD CONSTRAINT "TaxWithholdingRecord_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaxWithholdingRecord" ADD CONSTRAINT "TaxWithholdingRecord_electronicDocumentId_fkey" FOREIGN KEY ("electronicDocumentId") REFERENCES "ElectronicDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaxWithholdingRecord" ADD CONSTRAINT "TaxWithholdingRecord_regimenCodigo_fkey" FOREIGN KEY ("regimenCodigo") REFERENCES "SunatWithholdingRate"("codigo") ON DELETE SET NULL ON UPDATE CASCADE;
