-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('ACTIVA', 'PARCIALMENTE_DISPENSADA', 'COMPLETADA', 'VENCIDA', 'ANULADA');
CREATE TYPE "ControlledLedgerMovementType" AS ENUM ('ENTRADA', 'SALIDA');
CREATE TYPE "AdverseEventSeverity" AS ENUM ('LEVE', 'MODERADO', 'GRAVE');

-- CreateTable Medico
CREATE TABLE "Medico" (
    "id" TEXT NOT NULL,
    "cmp" VARCHAR(20) NOT NULL,
    "nombres" VARCHAR(120) NOT NULL,
    "apellidos" VARCHAR(120) NOT NULL,
    "especialidad" VARCHAR(120),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Medico_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Medico_cmp_key" ON "Medico"("cmp");
CREATE INDEX "Medico_deletedAt_idx" ON "Medico"("deletedAt");

-- CreateTable ControlledSubstanceCategory
CREATE TABLE "ControlledSubstanceCategory" (
    "id" TEXT NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "schedule" VARCHAR(20) NOT NULL,
    "descripcion" VARCHAR(500),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ControlledSubstanceCategory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ControlledSubstanceCategory_codigo_key" ON "ControlledSubstanceCategory"("codigo");
CREATE INDEX "ControlledSubstanceCategory_deletedAt_idx" ON "ControlledSubstanceCategory"("deletedAt");

-- CreateTable Cie10Code
CREATE TABLE "Cie10Code" (
    "id" TEXT NOT NULL,
    "codigo" VARCHAR(10) NOT NULL,
    "descripcion" VARCHAR(500) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Cie10Code_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Cie10Code_codigo_key" ON "Cie10Code"("codigo");
CREATE INDEX "Cie10Code_deletedAt_idx" ON "Cie10Code"("deletedAt");

-- CreateTable Prescription
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "numero" VARCHAR(30) NOT NULL,
    "fechaEmision" TIMESTAMP(3) NOT NULL,
    "medicoId" TEXT,
    "medicoNombre" VARCHAR(200),
    "medicoCmp" VARCHAR(20),
    "customerId" TEXT NOT NULL,
    "diagnostico" VARCHAR(500),
    "imagenArchivoId" TEXT,
    "estado" "PrescriptionStatus" NOT NULL DEFAULT 'ACTIVA',
    "validUntil" TIMESTAMP(3),
    "notas" VARCHAR(500),
    "registeredById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Prescription_establishmentId_numero_key" ON "Prescription"("establishmentId", "numero");
CREATE INDEX "Prescription_establishmentId_idx" ON "Prescription"("establishmentId");
CREATE INDEX "Prescription_customerId_idx" ON "Prescription"("customerId");
CREATE INDEX "Prescription_medicoId_idx" ON "Prescription"("medicoId");
CREATE INDEX "Prescription_estado_idx" ON "Prescription"("estado");
CREATE INDEX "Prescription_deletedAt_idx" ON "Prescription"("deletedAt");

-- CreateTable PrescriptionItem
CREATE TABLE "PrescriptionItem" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "dosis" VARCHAR(120),
    "cantidadPrescrita" DECIMAL(18,4) NOT NULL,
    "cantidadDispensada" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "indicaciones" VARCHAR(500),
    CONSTRAINT "PrescriptionItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PrescriptionItem_prescriptionId_idx" ON "PrescriptionItem"("prescriptionId");
CREATE INDEX "PrescriptionItem_productId_idx" ON "PrescriptionItem"("productId");

-- CreateTable ControlledSubstanceLedgerEntry
CREATE TABLE "ControlledSubstanceLedgerEntry" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "movementType" "ControlledLedgerMovementType" NOT NULL,
    "cantidad" DECIMAL(18,4) NOT NULL,
    "saldo" DECIMAL(18,4) NOT NULL,
    "referencia" VARCHAR(120),
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ControlledSubstanceLedgerEntry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ControlledSubstanceLedgerEntry_establishmentId_fecha_idx" ON "ControlledSubstanceLedgerEntry"("establishmentId", "fecha");
CREATE INDEX "ControlledSubstanceLedgerEntry_productId_idx" ON "ControlledSubstanceLedgerEntry"("productId");

-- CreateTable AdverseEvent
CREATE TABLE "AdverseEvent" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "customerId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descripcion" VARCHAR(2000) NOT NULL,
    "severidad" "AdverseEventSeverity" NOT NULL DEFAULT 'LEVE',
    "notificadoDigemid" BOOLEAN NOT NULL DEFAULT false,
    "registeredById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdverseEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AdverseEvent_establishmentId_idx" ON "AdverseEvent"("establishmentId");
CREATE INDEX "AdverseEvent_productId_idx" ON "AdverseEvent"("productId");
CREATE INDEX "AdverseEvent_deletedAt_idx" ON "AdverseEvent"("deletedAt");

-- CreateTable SaleSubstitution
CREATE TABLE "SaleSubstitution" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productOriginalId" TEXT NOT NULL,
    "productSustitutoId" TEXT NOT NULL,
    "motivo" VARCHAR(500),
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SaleSubstitution_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SaleSubstitution_saleId_idx" ON "SaleSubstitution"("saleId");

-- AlterTable Product
ALTER TABLE "Product" ADD COLUMN "controlledSubstanceCategoryId" TEXT;

-- AlterTable Sale
ALTER TABLE "Sale" ADD COLUMN "prescriptionId" TEXT;
CREATE INDEX "Sale_prescriptionId_idx" ON "Sale"("prescriptionId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_controlledSubstanceCategoryId_fkey" FOREIGN KEY ("controlledSubstanceCategoryId") REFERENCES "ControlledSubstanceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "Medico"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ControlledSubstanceLedgerEntry" ADD CONSTRAINT "ControlledSubstanceLedgerEntry_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ControlledSubstanceLedgerEntry" ADD CONSTRAINT "ControlledSubstanceLedgerEntry_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ControlledSubstanceLedgerEntry" ADD CONSTRAINT "ControlledSubstanceLedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdverseEvent" ADD CONSTRAINT "AdverseEvent_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdverseEvent" ADD CONSTRAINT "AdverseEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdverseEvent" ADD CONSTRAINT "AdverseEvent_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdverseEvent" ADD CONSTRAINT "AdverseEvent_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SaleSubstitution" ADD CONSTRAINT "SaleSubstitution_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SaleSubstitution" ADD CONSTRAINT "SaleSubstitution_productOriginalId_fkey" FOREIGN KEY ("productOriginalId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaleSubstitution" ADD CONSTRAINT "SaleSubstitution_productSustitutoId_fkey" FOREIGN KEY ("productSustitutoId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaleSubstitution" ADD CONSTRAINT "SaleSubstitution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
