-- CreateTable
CREATE TABLE "ProductIscSystem" (
    "id" TEXT NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductIscSystem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductIscSystem_codigo_key" ON "ProductIscSystem"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ProductIscSystem_nombre_key" ON "ProductIscSystem"("nombre");

-- CreateIndex
CREATE INDEX "ProductIscSystem_deletedAt_idx" ON "ProductIscSystem"("deletedAt");

-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "codigoLote" VARCHAR(60),
ADD COLUMN "fechaVencimientoLote" TIMESTAMP(3),
ADD COLUMN "tipoSistemaIscId" TEXT,
ADD COLUMN "porcentajeIsc" DECIMAL(9,4),
ADD COLUMN "numeroPuntos" DECIMAL(18,4);

-- CreateIndex
CREATE INDEX "Product_tipoSistemaIscId_idx" ON "Product"("tipoSistemaIscId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_tipoSistemaIscId_fkey" FOREIGN KEY ("tipoSistemaIscId") REFERENCES "ProductIscSystem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
