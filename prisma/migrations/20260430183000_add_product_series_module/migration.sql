-- CreateEnum
CREATE TYPE "ProductSerialStatus" AS ENUM ('DISPONIBLE', 'RESERVADO', 'VENDIDO', 'ANULADO');

-- CreateTable
CREATE TABLE "ProductSerial" (
    "id" TEXT NOT NULL,
    "serie" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "ProductSerialStatus" NOT NULL DEFAULT 'DISPONIBLE',
    "vendido" BOOLEAN NOT NULL DEFAULT false,
    "soldAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSerial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductSerial_serie_key" ON "ProductSerial"("serie");

-- CreateIndex
CREATE INDEX "ProductSerial_deletedAt_idx" ON "ProductSerial"("deletedAt");

-- CreateIndex
CREATE INDEX "ProductSerial_serie_idx" ON "ProductSerial"("serie");

-- CreateIndex
CREATE INDEX "ProductSerial_productId_idx" ON "ProductSerial"("productId");

-- CreateIndex
CREATE INDEX "ProductSerial_estado_idx" ON "ProductSerial"("estado");

-- AddForeignKey
ALTER TABLE "ProductSerial" ADD CONSTRAINT "ProductSerial_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
