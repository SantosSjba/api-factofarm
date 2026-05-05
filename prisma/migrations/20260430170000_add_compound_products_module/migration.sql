-- CreateTable
CREATE TABLE "CompoundProductPlatform" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompoundProductPlatform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompoundProduct" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombreSecundario" TEXT,
    "descripcion" TEXT,
    "modelo" TEXT,
    "unitId" TEXT NOT NULL,
    "currencyId" TEXT NOT NULL,
    "saleTaxAffectationId" TEXT NOT NULL,
    "precioUnitarioVenta" DECIMAL(18,4) NOT NULL,
    "incluyeIgvVenta" BOOLEAN NOT NULL DEFAULT true,
    "plataformaId" TEXT,
    "codigoSunat" TEXT,
    "codigoInterno" TEXT,
    "precioUnitarioCompra" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "totalPrecioCompraReferencia" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "categoryId" TEXT,
    "brandId" TEXT,
    "imagenArchivoId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompoundProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompoundProductItem" (
    "id" TEXT NOT NULL,
    "compoundProductId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "cantidad" DECIMAL(18,4) NOT NULL DEFAULT 1,
    "precioUnitario" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,4) NOT NULL DEFAULT 0,

    CONSTRAINT "CompoundProductItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompoundProductPlatform_nombre_key" ON "CompoundProductPlatform"("nombre");

-- CreateIndex
CREATE INDEX "CompoundProductPlatform_deletedAt_idx" ON "CompoundProductPlatform"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CompoundProduct_imagenArchivoId_key" ON "CompoundProduct"("imagenArchivoId");

-- CreateIndex
CREATE INDEX "CompoundProduct_deletedAt_idx" ON "CompoundProduct"("deletedAt");

-- CreateIndex
CREATE INDEX "CompoundProduct_nombre_idx" ON "CompoundProduct"("nombre");

-- CreateIndex
CREATE INDEX "CompoundProduct_codigoInterno_idx" ON "CompoundProduct"("codigoInterno");

-- CreateIndex
CREATE INDEX "CompoundProduct_categoryId_idx" ON "CompoundProduct"("categoryId");

-- CreateIndex
CREATE INDEX "CompoundProductItem_compoundProductId_idx" ON "CompoundProductItem"("compoundProductId");

-- CreateIndex
CREATE INDEX "CompoundProductItem_productId_idx" ON "CompoundProductItem"("productId");

-- AddForeignKey
ALTER TABLE "CompoundProduct" ADD CONSTRAINT "CompoundProduct_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "UnitOfMeasure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompoundProduct" ADD CONSTRAINT "CompoundProduct_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompoundProduct" ADD CONSTRAINT "CompoundProduct_saleTaxAffectationId_fkey" FOREIGN KEY ("saleTaxAffectationId") REFERENCES "TaxAffectationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompoundProduct" ADD CONSTRAINT "CompoundProduct_plataformaId_fkey" FOREIGN KEY ("plataformaId") REFERENCES "CompoundProductPlatform"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompoundProduct" ADD CONSTRAINT "CompoundProduct_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompoundProduct" ADD CONSTRAINT "CompoundProduct_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompoundProduct" ADD CONSTRAINT "CompoundProduct_imagenArchivoId_fkey" FOREIGN KEY ("imagenArchivoId") REFERENCES "archivos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompoundProductItem" ADD CONSTRAINT "CompoundProductItem_compoundProductId_fkey" FOREIGN KEY ("compoundProductId") REFERENCES "CompoundProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompoundProductItem" ADD CONSTRAINT "CompoundProductItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
