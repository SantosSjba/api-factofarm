-- CreateTable
CREATE TABLE "ShippingCarrier" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "ruc" VARCHAR(11) NOT NULL,
    "razonSocial" VARCHAR(200) NOT NULL,
    "nombreComercial" VARCHAR(200),
    "telefono" VARCHAR(40),
    "correo" VARCHAR(120),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingCarrier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingDriver" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "carrierId" TEXT,
    "tipoDocumento" "CustomerDocumentType" NOT NULL DEFAULT 'DNI',
    "numeroDocumento" VARCHAR(20) NOT NULL,
    "nombres" VARCHAR(120) NOT NULL,
    "apellidos" VARCHAR(120) NOT NULL,
    "licencia" VARCHAR(40),
    "telefono" VARCHAR(40),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingDriver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingVehicle" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "carrierId" TEXT,
    "placa" VARCHAR(20) NOT NULL,
    "marca" VARCHAR(80),
    "modelo" VARCHAR(80),
    "capacidadKg" DECIMAL(10,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartureAddress" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "codigo" VARCHAR(40) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "direccion" VARCHAR(500) NOT NULL,
    "departmentId" TEXT,
    "provinceId" TEXT,
    "districtId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepartureAddress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShippingCarrier_establishmentId_idx" ON "ShippingCarrier"("establishmentId");

-- CreateIndex
CREATE INDEX "ShippingCarrier_deletedAt_idx" ON "ShippingCarrier"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ShippingCarrier_establishmentId_ruc_key" ON "ShippingCarrier"("establishmentId", "ruc");

-- CreateIndex
CREATE INDEX "ShippingDriver_establishmentId_idx" ON "ShippingDriver"("establishmentId");

-- CreateIndex
CREATE INDEX "ShippingDriver_carrierId_idx" ON "ShippingDriver"("carrierId");

-- CreateIndex
CREATE INDEX "ShippingDriver_deletedAt_idx" ON "ShippingDriver"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ShippingDriver_establishmentId_numeroDocumento_key" ON "ShippingDriver"("establishmentId", "numeroDocumento");

-- CreateIndex
CREATE INDEX "ShippingVehicle_establishmentId_idx" ON "ShippingVehicle"("establishmentId");

-- CreateIndex
CREATE INDEX "ShippingVehicle_carrierId_idx" ON "ShippingVehicle"("carrierId");

-- CreateIndex
CREATE INDEX "ShippingVehicle_deletedAt_idx" ON "ShippingVehicle"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ShippingVehicle_establishmentId_placa_key" ON "ShippingVehicle"("establishmentId", "placa");

-- CreateIndex
CREATE INDEX "DepartureAddress_establishmentId_idx" ON "DepartureAddress"("establishmentId");

-- CreateIndex
CREATE INDEX "DepartureAddress_deletedAt_idx" ON "DepartureAddress"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DepartureAddress_establishmentId_codigo_key" ON "DepartureAddress"("establishmentId", "codigo");

-- AddForeignKey
ALTER TABLE "ShippingCarrier" ADD CONSTRAINT "ShippingCarrier_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingDriver" ADD CONSTRAINT "ShippingDriver_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingDriver" ADD CONSTRAINT "ShippingDriver_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "ShippingCarrier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingVehicle" ADD CONSTRAINT "ShippingVehicle_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingVehicle" ADD CONSTRAINT "ShippingVehicle_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "ShippingCarrier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartureAddress" ADD CONSTRAINT "DepartureAddress_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartureAddress" ADD CONSTRAINT "DepartureAddress_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartureAddress" ADD CONSTRAINT "DepartureAddress_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "provinces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartureAddress" ADD CONSTRAINT "DepartureAddress_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
