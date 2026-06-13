-- Fase 10: convenios, cuentas por cobrar, hospital, finanzas

CREATE TYPE "AgreementType" AS ENUM ('EPS', 'CLINICA', 'EMPRESA', 'HOSPITAL', 'SEGURO');
CREATE TYPE "AgreementInstitutionType" AS ENUM ('SIS', 'ESSALUD', 'EPS', 'PRIVADO', 'OTRO');
CREATE TYPE "AgreementBillingStatus" AS ENUM ('BORRADOR', 'EMITIDA', 'PAGADA');
CREATE TYPE "AccountReceivableStatus" AS ENUM ('PENDIENTE', 'PARCIAL', 'PAGADA', 'VENCIDA', 'ANULADA');
CREATE TYPE "HospitalAreaType" AS ENUM ('PABELLON', 'SERVICIO', 'CARRO_PARO', 'BOTIQUIN');
CREATE TYPE "HospitalConsumptionStatus" AS ENUM ('SOLICITADO', 'DISPENSADO', 'CANCELADO');
CREATE TYPE "BankAccountType" AS ENUM ('CAJA', 'BANCO');
CREATE TYPE "BankMovementType" AS ENUM ('INGRESO', 'EGRESO');

ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "agreementId" TEXT;
CREATE INDEX IF NOT EXISTS "Customer_agreementId_idx" ON "Customer"("agreementId");

ALTER TABLE "Sale"
  ADD COLUMN IF NOT EXISTS "agreementId" TEXT,
  ADD COLUMN IF NOT EXISTS "coberturaConvenio" DECIMAL(18,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "copagoPaciente" DECIMAL(18,4) NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "Sale_agreementId_idx" ON "Sale"("agreementId");

CREATE TABLE "Agreement" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "codigo" VARCHAR(40) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "tipo" "AgreementType" NOT NULL,
    "institucionTipo" "AgreementInstitutionType",
    "coberturaPorcentaje" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "diasCredito" INTEGER NOT NULL DEFAULT 30,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "contactoNombre" VARCHAR(120),
    "contactoEmail" VARCHAR(120),
    "contactoTelefono" VARCHAR(30),
    "notas" VARCHAR(500),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agreement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgreementProductPrice" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "precio" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "AgreementProductPrice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgreementBillingStatement" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "periodo" VARCHAR(7) NOT NULL,
    "totalVentas" DECIMAL(18,4) NOT NULL,
    "totalCobertura" DECIMAL(18,4) NOT NULL,
    "totalCopago" DECIMAL(18,4) NOT NULL,
    "estado" "AgreementBillingStatus" NOT NULL DEFAULT 'BORRADOR',
    "emittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgreementBillingStatement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgreementBillingStatementLine" (
    "id" TEXT NOT NULL,
    "billingStatementId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "totalVenta" DECIMAL(18,4) NOT NULL,
    "cobertura" DECIMAL(18,4) NOT NULL,
    "copago" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "AgreementBillingStatementLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccountReceivable" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "saleId" TEXT,
    "agreementId" TEXT,
    "documentoRef" VARCHAR(60),
    "montoTotal" DECIMAL(18,4) NOT NULL,
    "montoPagado" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "saldo" DECIMAL(18,4) NOT NULL,
    "fechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3),
    "estado" "AccountReceivableStatus" NOT NULL DEFAULT 'PENDIENTE',
    "comentario" VARCHAR(500),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountReceivable_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccountReceivablePayment" (
    "id" TEXT NOT NULL,
    "accountReceivableId" TEXT NOT NULL,
    "monto" DECIMAL(18,4) NOT NULL,
    "metodoPago" VARCHAR(40),
    "referencia" VARCHAR(120),
    "pagadoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "AccountReceivablePayment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HospitalArea" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "codigo" VARCHAR(40) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "tipo" "HospitalAreaType" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HospitalArea_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HospitalInternalConsumption" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "hospitalAreaId" TEXT NOT NULL,
    "solicitadoPorId" TEXT NOT NULL,
    "dispensadoPorId" TEXT,
    "estado" "HospitalConsumptionStatus" NOT NULL DEFAULT 'SOLICITADO',
    "motivo" VARCHAR(500),
    "comentario" VARCHAR(500),
    "dispensadoAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HospitalInternalConsumption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HospitalInternalConsumptionItem" (
    "id" TEXT NOT NULL,
    "consumptionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "cantidad" DECIMAL(18,4) NOT NULL,
    "notas" VARCHAR(200),

    CONSTRAINT "HospitalInternalConsumptionItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "tipo" "BankAccountType" NOT NULL DEFAULT 'BANCO',
    "banco" VARCHAR(120),
    "numeroCuenta" VARCHAR(40),
    "moneda" VARCHAR(3) NOT NULL DEFAULT 'PEN',
    "saldoLibro" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BankMovement" (
    "id" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "tipo" "BankMovementType" NOT NULL,
    "monto" DECIMAL(18,4) NOT NULL,
    "referencia" VARCHAR(120),
    "descripcion" VARCHAR(500),
    "conciliado" BOOLEAN NOT NULL DEFAULT false,
    "conciliadoAt" TIMESTAMP(3),
    "movimientoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "BankMovement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PurchaseBudget" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "montoPresupuestado" DECIMAL(18,4) NOT NULL,
    "notas" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseBudget_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Agreement_establishmentId_codigo_key" ON "Agreement"("establishmentId", "codigo");
CREATE INDEX "Agreement_establishmentId_idx" ON "Agreement"("establishmentId");
CREATE INDEX "Agreement_deletedAt_idx" ON "Agreement"("deletedAt");

CREATE UNIQUE INDEX "AgreementProductPrice_agreementId_productId_key" ON "AgreementProductPrice"("agreementId", "productId");
CREATE INDEX "AgreementProductPrice_productId_idx" ON "AgreementProductPrice"("productId");

CREATE UNIQUE INDEX "AgreementBillingStatement_agreementId_periodo_key" ON "AgreementBillingStatement"("agreementId", "periodo");
CREATE INDEX "AgreementBillingStatement_agreementId_idx" ON "AgreementBillingStatement"("agreementId");

CREATE INDEX "AgreementBillingStatementLine_billingStatementId_idx" ON "AgreementBillingStatementLine"("billingStatementId");
CREATE INDEX "AgreementBillingStatementLine_saleId_idx" ON "AgreementBillingStatementLine"("saleId");

CREATE UNIQUE INDEX "AccountReceivable_saleId_key" ON "AccountReceivable"("saleId");
CREATE INDEX "AccountReceivable_establishmentId_idx" ON "AccountReceivable"("establishmentId");
CREATE INDEX "AccountReceivable_customerId_idx" ON "AccountReceivable"("customerId");
CREATE INDEX "AccountReceivable_estado_idx" ON "AccountReceivable"("estado");
CREATE INDEX "AccountReceivable_fechaVencimiento_idx" ON "AccountReceivable"("fechaVencimiento");
CREATE INDEX "AccountReceivable_deletedAt_idx" ON "AccountReceivable"("deletedAt");

CREATE INDEX "AccountReceivablePayment_accountReceivableId_idx" ON "AccountReceivablePayment"("accountReceivableId");

CREATE UNIQUE INDEX "HospitalArea_establishmentId_codigo_key" ON "HospitalArea"("establishmentId", "codigo");
CREATE INDEX "HospitalArea_establishmentId_idx" ON "HospitalArea"("establishmentId");
CREATE INDEX "HospitalArea_deletedAt_idx" ON "HospitalArea"("deletedAt");

CREATE INDEX "HospitalInternalConsumption_establishmentId_idx" ON "HospitalInternalConsumption"("establishmentId");
CREATE INDEX "HospitalInternalConsumption_hospitalAreaId_idx" ON "HospitalInternalConsumption"("hospitalAreaId");
CREATE INDEX "HospitalInternalConsumption_estado_idx" ON "HospitalInternalConsumption"("estado");
CREATE INDEX "HospitalInternalConsumption_deletedAt_idx" ON "HospitalInternalConsumption"("deletedAt");

CREATE INDEX "HospitalInternalConsumptionItem_consumptionId_idx" ON "HospitalInternalConsumptionItem"("consumptionId");
CREATE INDEX "HospitalInternalConsumptionItem_productId_idx" ON "HospitalInternalConsumptionItem"("productId");

CREATE INDEX "BankAccount_establishmentId_idx" ON "BankAccount"("establishmentId");
CREATE INDEX "BankAccount_deletedAt_idx" ON "BankAccount"("deletedAt");

CREATE INDEX "BankMovement_bankAccountId_idx" ON "BankMovement"("bankAccountId");
CREATE INDEX "BankMovement_conciliado_idx" ON "BankMovement"("conciliado");
CREATE INDEX "BankMovement_movimientoAt_idx" ON "BankMovement"("movimientoAt");

CREATE UNIQUE INDEX "PurchaseBudget_establishmentId_anio_mes_key" ON "PurchaseBudget"("establishmentId", "anio", "mes");
CREATE INDEX "PurchaseBudget_establishmentId_idx" ON "PurchaseBudget"("establishmentId");

ALTER TABLE "Customer" ADD CONSTRAINT "Customer_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgreementProductPrice" ADD CONSTRAINT "AgreementProductPrice_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgreementProductPrice" ADD CONSTRAINT "AgreementProductPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgreementBillingStatement" ADD CONSTRAINT "AgreementBillingStatement_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgreementBillingStatementLine" ADD CONSTRAINT "AgreementBillingStatementLine_billingStatementId_fkey" FOREIGN KEY ("billingStatementId") REFERENCES "AgreementBillingStatement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgreementBillingStatementLine" ADD CONSTRAINT "AgreementBillingStatementLine_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AccountReceivable" ADD CONSTRAINT "AccountReceivable_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AccountReceivable" ADD CONSTRAINT "AccountReceivable_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AccountReceivable" ADD CONSTRAINT "AccountReceivable_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AccountReceivable" ADD CONSTRAINT "AccountReceivable_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AccountReceivablePayment" ADD CONSTRAINT "AccountReceivablePayment_accountReceivableId_fkey" FOREIGN KEY ("accountReceivableId") REFERENCES "AccountReceivable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountReceivablePayment" ADD CONSTRAINT "AccountReceivablePayment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HospitalArea" ADD CONSTRAINT "HospitalArea_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "HospitalInternalConsumption" ADD CONSTRAINT "HospitalInternalConsumption_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HospitalInternalConsumption" ADD CONSTRAINT "HospitalInternalConsumption_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HospitalInternalConsumption" ADD CONSTRAINT "HospitalInternalConsumption_hospitalAreaId_fkey" FOREIGN KEY ("hospitalAreaId") REFERENCES "HospitalArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HospitalInternalConsumption" ADD CONSTRAINT "HospitalInternalConsumption_solicitadoPorId_fkey" FOREIGN KEY ("solicitadoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HospitalInternalConsumption" ADD CONSTRAINT "HospitalInternalConsumption_dispensadoPorId_fkey" FOREIGN KEY ("dispensadoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HospitalInternalConsumptionItem" ADD CONSTRAINT "HospitalInternalConsumptionItem_consumptionId_fkey" FOREIGN KEY ("consumptionId") REFERENCES "HospitalInternalConsumption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HospitalInternalConsumptionItem" ADD CONSTRAINT "HospitalInternalConsumptionItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BankMovement" ADD CONSTRAINT "BankMovement_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BankMovement" ADD CONSTRAINT "BankMovement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PurchaseBudget" ADD CONSTRAINT "PurchaseBudget_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
