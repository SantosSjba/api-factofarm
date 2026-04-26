-- CreateEnum
CREATE TYPE "PresentationDefaultPrice" AS ENUM ('PRECIO_1', 'PRECIO_2', 'PRECIO_3');

-- CreateTable
CREATE TABLE "UnitOfMeasure" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnitOfMeasure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Currency" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Currency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxAffectationType" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxAffectationType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductLocation" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAttributeType" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductAttributeType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "principioActivo" TEXT,
    "concentracion" TEXT,
    "registroSanitario" TEXT,
    "formaFarmaceutica" TEXT,
    "codigoBusqueda" TEXT,
    "codigoInterno" TEXT,
    "codigoBarra" TEXT,
    "codigoSunat" TEXT,
    "codigoMedicamentoDigemid" TEXT,
    "lineaProducto" TEXT,
    "modelo" TEXT,
    "marcaLaboratorio" TEXT,
    "unitId" TEXT NOT NULL,
    "currencyId" TEXT NOT NULL,
    "saleTaxAffectationId" TEXT NOT NULL,
    "purchaseTaxAffectationId" TEXT,
    "precioUnitarioVenta" DECIMAL(18,4) NOT NULL,
    "precioUnitarioCompra" DECIMAL(18,4),
    "incluyeIgvVenta" BOOLEAN NOT NULL DEFAULT true,
    "incluyeIgvCompra" BOOLEAN NOT NULL DEFAULT true,
    "generico" BOOLEAN NOT NULL DEFAULT false,
    "necesitaRecetaMedica" BOOLEAN NOT NULL DEFAULT false,
    "calcularCantidadPorPrecio" BOOLEAN NOT NULL DEFAULT false,
    "manejaLotes" BOOLEAN NOT NULL DEFAULT false,
    "incluyeIscVenta" BOOLEAN NOT NULL DEFAULT false,
    "incluyeIscCompra" BOOLEAN NOT NULL DEFAULT false,
    "sujetoDetraccion" BOOLEAN NOT NULL DEFAULT false,
    "sePuedeCanjearPorPuntos" BOOLEAN NOT NULL DEFAULT false,
    "aplicaGanancia" BOOLEAN NOT NULL DEFAULT false,
    "porcentajeGanancia" DECIMAL(9,4),
    "costoUnitario" DECIMAL(18,4),
    "stockMinimo" INTEGER NOT NULL DEFAULT 1,
    "categoryId" TEXT,
    "brandId" TEXT,
    "productLocationId" TEXT,
    "defaultWarehouseId" TEXT,
    "imagenArchivoId" TEXT,
    "habilitado" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductWarehousePrice" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "precio" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "ProductWarehousePrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductWarehouseStock" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "cantidad" DECIMAL(18,4) NOT NULL DEFAULT 0,

    CONSTRAINT "ProductWarehouseStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPresentation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "codigoBarra" TEXT,
    "unitId" TEXT NOT NULL,
    "descripcion" TEXT,
    "factor" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "precio1" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "precio2" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "precio3" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "precioDefecto" "PresentationDefaultPrice" NOT NULL DEFAULT 'PRECIO_1',
    "precioPuntos" DECIMAL(18,4),

    CONSTRAINT "ProductPresentation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAttribute" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "attributeTypeId" TEXT NOT NULL,
    "descripcion" VARCHAR(500) NOT NULL,

    CONSTRAINT "ProductAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UnitOfMeasure_codigo_key" ON "UnitOfMeasure"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "UnitOfMeasure_nombre_key" ON "UnitOfMeasure"("nombre");

-- CreateIndex
CREATE INDEX "UnitOfMeasure_deletedAt_idx" ON "UnitOfMeasure"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Currency_codigo_key" ON "Currency"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Currency_nombre_key" ON "Currency"("nombre");

-- CreateIndex
CREATE INDEX "Currency_deletedAt_idx" ON "Currency"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TaxAffectationType_codigo_key" ON "TaxAffectationType"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "TaxAffectationType_descripcion_key" ON "TaxAffectationType"("descripcion");

-- CreateIndex
CREATE INDEX "TaxAffectationType_deletedAt_idx" ON "TaxAffectationType"("deletedAt");

-- CreateIndex
CREATE INDEX "Warehouse_establishmentId_idx" ON "Warehouse"("establishmentId");

-- CreateIndex
CREATE INDEX "Warehouse_deletedAt_idx" ON "Warehouse"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_establishmentId_nombre_key" ON "Warehouse"("establishmentId", "nombre");

-- CreateIndex
CREATE INDEX "ProductLocation_establishmentId_idx" ON "ProductLocation"("establishmentId");

-- CreateIndex
CREATE INDEX "ProductLocation_deletedAt_idx" ON "ProductLocation"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductLocation_establishmentId_nombre_key" ON "ProductLocation"("establishmentId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAttributeType_nombre_key" ON "ProductAttributeType"("nombre");

-- CreateIndex
CREATE INDEX "ProductAttributeType_deletedAt_idx" ON "ProductAttributeType"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Product_imagenArchivoId_key" ON "Product"("imagenArchivoId");

-- CreateIndex
CREATE INDEX "Product_deletedAt_idx" ON "Product"("deletedAt");

-- CreateIndex
CREATE INDEX "Product_nombre_idx" ON "Product"("nombre");

-- CreateIndex
CREATE INDEX "Product_codigoInterno_idx" ON "Product"("codigoInterno");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "ProductWarehousePrice_warehouseId_idx" ON "ProductWarehousePrice"("warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductWarehousePrice_productId_warehouseId_key" ON "ProductWarehousePrice"("productId", "warehouseId");

-- CreateIndex
CREATE INDEX "ProductWarehouseStock_warehouseId_idx" ON "ProductWarehouseStock"("warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductWarehouseStock_productId_warehouseId_key" ON "ProductWarehouseStock"("productId", "warehouseId");

-- CreateIndex
CREATE INDEX "ProductPresentation_productId_idx" ON "ProductPresentation"("productId");

-- CreateIndex
CREATE INDEX "ProductAttribute_productId_idx" ON "ProductAttribute"("productId");

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductLocation" ADD CONSTRAINT "ProductLocation_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "UnitOfMeasure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_saleTaxAffectationId_fkey" FOREIGN KEY ("saleTaxAffectationId") REFERENCES "TaxAffectationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_purchaseTaxAffectationId_fkey" FOREIGN KEY ("purchaseTaxAffectationId") REFERENCES "TaxAffectationType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_productLocationId_fkey" FOREIGN KEY ("productLocationId") REFERENCES "ProductLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_defaultWarehouseId_fkey" FOREIGN KEY ("defaultWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_imagenArchivoId_fkey" FOREIGN KEY ("imagenArchivoId") REFERENCES "archivos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductWarehousePrice" ADD CONSTRAINT "ProductWarehousePrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductWarehousePrice" ADD CONSTRAINT "ProductWarehousePrice_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductWarehouseStock" ADD CONSTRAINT "ProductWarehouseStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductWarehouseStock" ADD CONSTRAINT "ProductWarehouseStock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPresentation" ADD CONSTRAINT "ProductPresentation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPresentation" ADD CONSTRAINT "ProductPresentation_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "UnitOfMeasure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttribute" ADD CONSTRAINT "ProductAttribute_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttribute" ADD CONSTRAINT "ProductAttribute_attributeTypeId_fkey" FOREIGN KEY ("attributeTypeId") REFERENCES "ProductAttributeType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
