-- CreateEnum
CREATE TYPE "BillingProviderType" AS ENUM ('MOCK', 'NUBEFACT', 'BIZLINKS');
CREATE TYPE "SunatDocumentStatus" AS ENUM ('PENDIENTE', 'ENVIANDO', 'ACEPTADO', 'OBSERVADO', 'RECHAZADO', 'ANULADO', 'CONTINGENCIA');
CREATE TYPE "ElectronicDocumentType" AS ENUM ('FACTURA', 'BOLETA', 'NOTA_CREDITO', 'NOTA_DEBITO', 'GUIA_REMISION_REMITENTE', 'GUIA_REMISION_TRANSPORTISTA', 'RETENCION', 'PERCEPCION', 'NOTA_VENTA', 'LIQUIDACION_COMPRA', 'RESUMEN_BOLETAS', 'COMUNICACION_BAJA');
CREATE TYPE "BillingJobType" AS ENUM ('EMIT', 'RETRY', 'RESUMEN_BOLETAS', 'COMUNICACION_BAJA');
CREATE TYPE "BillingJobStatus" AS ENUM ('PENDIENTE', 'PROCESANDO', 'COMPLETADO', 'FALLIDO');

-- CreateTable
CREATE TABLE "EstablishmentBillingConfig" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "provider" "BillingProviderType" NOT NULL DEFAULT 'MOCK',
    "rucEmisor" VARCHAR(11),
    "razonSocialEmisor" VARCHAR(200),
    "apiUrl" VARCHAR(500),
    "apiTokenEncrypted" TEXT,
    "certificateEncrypted" TEXT,
    "certificatePasswordEncrypted" TEXT,
    "modoSandbox" BOOLEAN NOT NULL DEFAULT true,
    "autoEmitOnSale" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EstablishmentBillingConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ElectronicDocument" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "saleId" TEXT,
    "documentType" "ElectronicDocumentType" NOT NULL,
    "serie" VARCHAR(10) NOT NULL,
    "numero" VARCHAR(20) NOT NULL,
    "sunatStatus" "SunatDocumentStatus" NOT NULL DEFAULT 'PENDIENTE',
    "subtotal" DECIMAL(18,4) NOT NULL,
    "igvTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,4) NOT NULL,
    "moneda" VARCHAR(3) NOT NULL DEFAULT 'PEN',
    "esContingencia" BOOLEAN NOT NULL DEFAULT false,
    "externalId" VARCHAR(120),
    "xmlArchivoId" TEXT,
    "pdfArchivoId" TEXT,
    "cdrArchivoId" TEXT,
    "sunatCodigo" VARCHAR(20),
    "sunatDescripcion" VARCHAR(500),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "voidReason" VARCHAR(500),
    "relatedDocumentId" TEXT,
    "customerDocType" VARCHAR(20),
    "customerDocNumber" VARCHAR(20),
    "customerNombre" VARCHAR(200),
    "emittedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ElectronicDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ElectronicDocumentLine" (
    "id" TEXT NOT NULL,
    "electronicDocumentId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "descripcion" VARCHAR(500) NOT NULL,
    "codigoProducto" VARCHAR(60),
    "codigoSunat" VARCHAR(20),
    "unidadMedida" VARCHAR(10) NOT NULL DEFAULT 'NIU',
    "cantidad" DECIMAL(18,4) NOT NULL,
    "precioUnitario" DECIMAL(18,4) NOT NULL,
    "subtotalLinea" DECIMAL(18,4) NOT NULL,
    "igvLinea" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "totalLinea" DECIMAL(18,4) NOT NULL,
    "taxAffectationCodigo" VARCHAR(10),
    "taxAffectationDesc" VARCHAR(120),
    CONSTRAINT "ElectronicDocumentLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ElectronicDocumentTax" (
    "id" TEXT NOT NULL,
    "electronicDocumentId" TEXT NOT NULL,
    "taxCodigo" VARCHAR(10) NOT NULL,
    "taxNombre" VARCHAR(120) NOT NULL,
    "baseImponible" DECIMAL(18,4) NOT NULL,
    "monto" DECIMAL(18,4) NOT NULL,
    CONSTRAINT "ElectronicDocumentTax_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SunatResponse" (
    "id" TEXT NOT NULL,
    "electronicDocumentId" TEXT NOT NULL,
    "tipo" VARCHAR(40) NOT NULL,
    "codigo" VARCHAR(20),
    "descripcion" VARCHAR(500),
    "payload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SunatResponse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BillingJob" (
    "id" TEXT NOT NULL,
    "electronicDocumentId" TEXT NOT NULL,
    "jobType" "BillingJobType" NOT NULL,
    "status" "BillingJobStatus" NOT NULL DEFAULT 'PENDIENTE',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" VARCHAR(500),
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BillingJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EstablishmentBillingConfig_establishmentId_key" ON "EstablishmentBillingConfig"("establishmentId");
CREATE UNIQUE INDEX "ElectronicDocument_saleId_key" ON "ElectronicDocument"("saleId");
CREATE UNIQUE INDEX "ElectronicDocument_establishmentId_documentType_serie_numero_key" ON "ElectronicDocument"("establishmentId", "documentType", "serie", "numero");
CREATE INDEX "ElectronicDocument_establishmentId_idx" ON "ElectronicDocument"("establishmentId");
CREATE INDEX "ElectronicDocument_sunatStatus_idx" ON "ElectronicDocument"("sunatStatus");
CREATE INDEX "ElectronicDocument_createdAt_idx" ON "ElectronicDocument"("createdAt");
CREATE INDEX "ElectronicDocument_deletedAt_idx" ON "ElectronicDocument"("deletedAt");
CREATE INDEX "ElectronicDocumentLine_electronicDocumentId_idx" ON "ElectronicDocumentLine"("electronicDocumentId");
CREATE INDEX "ElectronicDocumentTax_electronicDocumentId_idx" ON "ElectronicDocumentTax"("electronicDocumentId");
CREATE INDEX "SunatResponse_electronicDocumentId_idx" ON "SunatResponse"("electronicDocumentId");
CREATE INDEX "BillingJob_status_scheduledAt_idx" ON "BillingJob"("status", "scheduledAt");
CREATE INDEX "BillingJob_electronicDocumentId_idx" ON "BillingJob"("electronicDocumentId");

-- AddForeignKey
ALTER TABLE "EstablishmentBillingConfig" ADD CONSTRAINT "EstablishmentBillingConfig_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectronicDocument" ADD CONSTRAINT "ElectronicDocument_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ElectronicDocument" ADD CONSTRAINT "ElectronicDocument_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ElectronicDocument" ADD CONSTRAINT "ElectronicDocument_relatedDocumentId_fkey" FOREIGN KEY ("relatedDocumentId") REFERENCES "ElectronicDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ElectronicDocumentLine" ADD CONSTRAINT "ElectronicDocumentLine_electronicDocumentId_fkey" FOREIGN KEY ("electronicDocumentId") REFERENCES "ElectronicDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectronicDocumentTax" ADD CONSTRAINT "ElectronicDocumentTax_electronicDocumentId_fkey" FOREIGN KEY ("electronicDocumentId") REFERENCES "ElectronicDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SunatResponse" ADD CONSTRAINT "SunatResponse_electronicDocumentId_fkey" FOREIGN KEY ("electronicDocumentId") REFERENCES "ElectronicDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingJob" ADD CONSTRAINT "BillingJob_electronicDocumentId_fkey" FOREIGN KEY ("electronicDocumentId") REFERENCES "ElectronicDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
