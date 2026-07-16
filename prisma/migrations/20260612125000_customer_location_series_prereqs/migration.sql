-- Prerequisites missing from earlier history: document enums, ubigeo,
-- customers and establishment series. Shape matches pre-tenant migrations;
-- later migrations add tenantId / LPDP / agreement / limiteCredito.

-- CreateEnum
CREATE TYPE "CustomerDocumentType" AS ENUM ('DNI', 'RUC', 'CE', 'PASAPORTE', 'DOC_SIN_RUC', 'OTRO');

-- CreateEnum
CREATE TYPE "DocumentSeriesType" AS ENUM (
    'FACTURA_ELECTRONICA',
    'BOLETA_VENTA_ELECTRONICA',
    'NOTA_CREDITO',
    'NOTA_DEBITO',
    'GUIA_REMISION_REMITENTE',
    'COMPROBANTE_RETENCION_ELECTRONICA',
    'GUIA_REMISION_TRANSPORTISTA',
    'COMPROBANTE_PERCEPCION_ELECTRONICA',
    'NOTA_VENTA',
    'LIQUIDACION_COMPRA',
    'GUIA_INGRESO_ALMACEN',
    'GUIA_SALIDA_ALMACEN',
    'GUIA_TRANSFERENCIA_ALMACEN'
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provinces" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" TEXT NOT NULL,
    "provinceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerType" (
    "id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerZone" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombreComercial" TEXT,
    "tipoDocumento" "CustomerDocumentType" NOT NULL,
    "numeroDocumento" TEXT NOT NULL,
    "nacionalidad" TEXT DEFAULT 'PERU',
    "diasCredito" INTEGER NOT NULL DEFAULT 0,
    "codigoInterno" TEXT,
    "codigoBarra" TEXT,
    "observaciones" TEXT,
    "sitioWeb" TEXT,
    "contactoNombre" TEXT,
    "contactoTelefono" TEXT,
    "correosOpcionales" TEXT,
    "telefono" TEXT,
    "correoElectronico" TEXT,
    "puntosAcumulados" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "habilitado" BOOLEAN NOT NULL DEFAULT true,
    "etiquetas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "vendedorAsignadoId" TEXT,
    "customerTypeId" TEXT,
    "zoneId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerAddress" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "pais" TEXT NOT NULL DEFAULT 'PERU',
    "departmentId" TEXT,
    "provinceId" TEXT,
    "districtId" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "correoElectronico" TEXT,
    "correosOpcionales" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstablishmentSeries" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "documentType" "DocumentSeriesType" NOT NULL,
    "numero" TEXT NOT NULL,
    "esContingencia" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstablishmentSeries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerType_descripcion_key" ON "CustomerType"("descripcion");

-- CreateIndex
CREATE INDEX "CustomerType_deletedAt_idx" ON "CustomerType"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerZone_nombre_key" ON "CustomerZone"("nombre");

-- CreateIndex
CREATE INDEX "CustomerZone_deletedAt_idx" ON "CustomerZone"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_tipoDocumento_numeroDocumento_key" ON "Customer"("tipoDocumento", "numeroDocumento");

-- CreateIndex
CREATE INDEX "Customer_deletedAt_idx" ON "Customer"("deletedAt");

-- CreateIndex
CREATE INDEX "Customer_customerTypeId_idx" ON "Customer"("customerTypeId");

-- CreateIndex
CREATE INDEX "Customer_zoneId_idx" ON "Customer"("zoneId");

-- CreateIndex
CREATE INDEX "Customer_vendedorAsignadoId_idx" ON "Customer"("vendedorAsignadoId");

-- CreateIndex
CREATE INDEX "Customer_nombre_idx" ON "Customer"("nombre");

-- CreateIndex
CREATE INDEX "Customer_numeroDocumento_idx" ON "Customer"("numeroDocumento");

-- CreateIndex
CREATE INDEX "CustomerAddress_customerId_esPrincipal_idx" ON "CustomerAddress"("customerId", "esPrincipal");

-- CreateIndex
CREATE INDEX "CustomerAddress_departmentId_idx" ON "CustomerAddress"("departmentId");

-- CreateIndex
CREATE INDEX "CustomerAddress_provinceId_idx" ON "CustomerAddress"("provinceId");

-- CreateIndex
CREATE INDEX "CustomerAddress_districtId_idx" ON "CustomerAddress"("districtId");

-- CreateIndex
CREATE INDEX "EstablishmentSeries_establishmentId_documentType_idx" ON "EstablishmentSeries"("establishmentId", "documentType");

-- CreateIndex
CREATE UNIQUE INDEX "EstablishmentSeries_establishmentId_documentType_numero_key" ON "EstablishmentSeries"("establishmentId", "documentType", "numero");

-- CreateIndex
CREATE INDEX "provinces_departmentId_idx" ON "provinces"("departmentId");

-- CreateIndex
CREATE INDEX "districts_provinceId_idx" ON "districts"("provinceId");

-- AddForeignKey
ALTER TABLE "provinces" ADD CONSTRAINT "provinces_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "provinces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_vendedorAsignadoId_fkey" FOREIGN KEY ("vendedorAsignadoId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_customerTypeId_fkey" FOREIGN KEY ("customerTypeId") REFERENCES "CustomerType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "CustomerZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "provinces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstablishmentSeries" ADD CONSTRAINT "EstablishmentSeries_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
