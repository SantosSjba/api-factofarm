-- Fase 8: compliance Perú (LPDP, farmacéutico, precios regulados, DIGEMID)

CREATE TYPE "LpdpConsentPurpose" AS ENUM ('CUSTOMER_REGISTER', 'PRESCRIPTION', 'MARKETING');
CREATE TYPE "ArcoRequestType" AS ENUM ('ACCESO', 'RECTIFICACION', 'CANCELACION', 'OPOSICION');
CREATE TYPE "ArcoRequestStatus" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'RECHAZADA');

ALTER TABLE "Establishment" ADD COLUMN "numeroRegistroDigemid" VARCHAR(40);
ALTER TABLE "Establishment" ADD COLUMN "titularPharmacistLicenseId" TEXT;
ALTER TABLE "Establishment" ADD COLUMN "blockSalesAboveRegulatedPrice" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Customer" ADD COLUMN "lpdpConsentVersion" VARCHAR(20);
ALTER TABLE "Customer" ADD COLUMN "lpdpConsentAt" TIMESTAMP(3);

ALTER TABLE "Product" ADD COLUMN "registroSanitarioVigencia" TIMESTAMP(3);

ALTER TABLE "Sale" ADD COLUMN "controlledPharmacistLicenseId" TEXT;
ALTER TABLE "Sale" ADD COLUMN "controlledDigitalSignature" VARCHAR(128);

ALTER TABLE "Prescription" ADD COLUMN "diagnosticoCipher" TEXT;
ALTER TABLE "Prescription" ADD COLUMN "notasCipher" TEXT;

CREATE TABLE "DataProcessingConsent" (
    "id" TEXT NOT NULL,
    "subjectType" VARCHAR(40) NOT NULL,
    "subjectId" VARCHAR(40) NOT NULL,
    "purpose" "LpdpConsentPurpose" NOT NULL,
    "consentVersion" VARCHAR(20) NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "ipAddress" VARCHAR(64),
    "userAgent" VARCHAR(300),
    "recordedById" TEXT,
    CONSTRAINT "DataProcessingConsent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ArcoRequest" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "requestType" "ArcoRequestType" NOT NULL,
    "status" "ArcoRequestStatus" NOT NULL DEFAULT 'PENDIENTE',
    "details" VARCHAR(500),
    "responseNotes" VARCHAR(500),
    "processedById" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ArcoRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PharmacistLicense" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "colegiaturaCqp" VARCHAR(20) NOT NULL,
    "fullName" VARCHAR(200) NOT NULL,
    "vigenciaHasta" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PharmacistLicense_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RegulatedDrugPrice" (
    "id" TEXT NOT NULL,
    "codigoDigemid" VARCHAR(40),
    "nombre" VARCHAR(300) NOT NULL,
    "precioMaximo" DECIMAL(18,4) NOT NULL,
    "vigenteDesde" TIMESTAMP(3),
    "vigenteHasta" TIMESTAMP(3),
    "fuente" VARCHAR(40) NOT NULL DEFAULT 'DIGEMED',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RegulatedDrugPrice_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DataProcessingConsent_subjectType_subjectId_idx" ON "DataProcessingConsent"("subjectType", "subjectId");
CREATE INDEX "DataProcessingConsent_purpose_idx" ON "DataProcessingConsent"("purpose");
CREATE INDEX "DataProcessingConsent_grantedAt_idx" ON "DataProcessingConsent"("grantedAt");

CREATE INDEX "ArcoRequest_customerId_idx" ON "ArcoRequest"("customerId");
CREATE INDEX "ArcoRequest_status_idx" ON "ArcoRequest"("status");
CREATE INDEX "ArcoRequest_requestType_idx" ON "ArcoRequest"("requestType");

CREATE UNIQUE INDEX "PharmacistLicense_userId_key" ON "PharmacistLicense"("userId");
CREATE INDEX "PharmacistLicense_colegiaturaCqp_idx" ON "PharmacistLicense"("colegiaturaCqp");
CREATE INDEX "PharmacistLicense_deletedAt_idx" ON "PharmacistLicense"("deletedAt");

CREATE INDEX "RegulatedDrugPrice_codigoDigemid_idx" ON "RegulatedDrugPrice"("codigoDigemid");
CREATE INDEX "RegulatedDrugPrice_activo_idx" ON "RegulatedDrugPrice"("activo");
CREATE INDEX "RegulatedDrugPrice_deletedAt_idx" ON "RegulatedDrugPrice"("deletedAt");

CREATE INDEX "Establishment_titularPharmacistLicenseId_idx" ON "Establishment"("titularPharmacistLicenseId");

ALTER TABLE "Establishment" ADD CONSTRAINT "Establishment_titularPharmacistLicenseId_fkey" FOREIGN KEY ("titularPharmacistLicenseId") REFERENCES "PharmacistLicense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DataProcessingConsent" ADD CONSTRAINT "DataProcessingConsent_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ArcoRequest" ADD CONSTRAINT "ArcoRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ArcoRequest" ADD CONSTRAINT "ArcoRequest_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PharmacistLicense" ADD CONSTRAINT "PharmacistLicense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Sale" ADD CONSTRAINT "Sale_controlledPharmacistLicenseId_fkey" FOREIGN KEY ("controlledPharmacistLicenseId") REFERENCES "PharmacistLicense"("id") ON DELETE SET NULL ON UPDATE CASCADE;
