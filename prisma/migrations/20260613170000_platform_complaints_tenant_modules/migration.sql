-- CreateEnum
CREATE TYPE "ComplaintKind" AS ENUM ('RECLAMO', 'QUEJA');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'RESOLVED', 'CLOSED');

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN "enabledModules" JSONB;

-- CreateTable
CREATE TABLE "complaints" (
    "id" TEXT NOT NULL,
    "numeroRegistro" VARCHAR(32) NOT NULL,
    "tipo" "ComplaintKind" NOT NULL,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'PENDING',
    "nombresApellidos" TEXT NOT NULL,
    "domicilio" TEXT NOT NULL,
    "documentoIdentidad" VARCHAR(20) NOT NULL,
    "telefono" VARCHAR(30) NOT NULL,
    "email" TEXT,
    "bienContratado" TEXT NOT NULL,
    "montoReclamado" VARCHAR(40),
    "detalle" TEXT NOT NULL,
    "pedido" TEXT NOT NULL,
    "internalNotes" TEXT,
    "responseNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "complaints_numeroRegistro_key" ON "complaints"("numeroRegistro");

-- CreateIndex
CREATE INDEX "complaints_status_idx" ON "complaints"("status");

-- CreateIndex
CREATE INDEX "complaints_createdAt_idx" ON "complaints"("createdAt");
