-- CreateTable
CREATE TABLE "Service" (
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
    "incluyeIscVenta" BOOLEAN NOT NULL DEFAULT false,
    "incluyeIscCompra" BOOLEAN NOT NULL DEFAULT false,
    "tipoSistemaIscId" TEXT,
    "porcentajeIsc" DECIMAL(9,4),
    "sujetoDetraccion" BOOLEAN NOT NULL DEFAULT false,
    "sePuedeCanjearPorPuntos" BOOLEAN NOT NULL DEFAULT false,
    "numeroPuntos" DECIMAL(18,4),
    "categoryId" TEXT,
    "brandId" TEXT,
    "productLocationId" TEXT,
    "imagenArchivoId" TEXT,
    "habilitado" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAttribute" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "attributeTypeId" TEXT NOT NULL,
    "descripcion" VARCHAR(500) NOT NULL,

    CONSTRAINT "ServiceAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Service_imagenArchivoId_key" ON "Service"("imagenArchivoId");

-- CreateIndex
CREATE INDEX "Service_deletedAt_idx" ON "Service"("deletedAt");

-- CreateIndex
CREATE INDEX "Service_nombre_idx" ON "Service"("nombre");

-- CreateIndex
CREATE INDEX "Service_codigoInterno_idx" ON "Service"("codigoInterno");

-- CreateIndex
CREATE INDEX "Service_tipoSistemaIscId_idx" ON "Service"("tipoSistemaIscId");

-- CreateIndex
CREATE INDEX "Service_categoryId_idx" ON "Service"("categoryId");

-- CreateIndex
CREATE INDEX "ServiceAttribute_serviceId_idx" ON "ServiceAttribute"("serviceId");

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "UnitOfMeasure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_saleTaxAffectationId_fkey" FOREIGN KEY ("saleTaxAffectationId") REFERENCES "TaxAffectationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_purchaseTaxAffectationId_fkey" FOREIGN KEY ("purchaseTaxAffectationId") REFERENCES "TaxAffectationType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_tipoSistemaIscId_fkey" FOREIGN KEY ("tipoSistemaIscId") REFERENCES "ProductIscSystem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_productLocationId_fkey" FOREIGN KEY ("productLocationId") REFERENCES "ProductLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_imagenArchivoId_fkey" FOREIGN KEY ("imagenArchivoId") REFERENCES "archivos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAttribute" ADD CONSTRAINT "ServiceAttribute_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAttribute" ADD CONSTRAINT "ServiceAttribute_attributeTypeId_fkey" FOREIGN KEY ("attributeTypeId") REFERENCES "ProductAttributeType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
