-- Fase 11: roles ampliados + personal + solicitudes de anulación

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ADMIN_CADENA';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'GERENTE_SUCURSAL';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'FARMACEUTICO_TITULAR';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'FARMACEUTICO';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'TECNICO_FARMACEUTICO';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CAJERO';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ALMACENERO';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CONTADOR';

CREATE TYPE "SaleVoidRequestStatus" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA');
CREATE TYPE "UserLeaveType" AS ENUM ('VACACIONES', 'LICENCIA_MEDICA', 'PERMISO', 'OTRO');
CREATE TYPE "UserLeaveStatus" AS ENUM ('SOLICITADO', 'APROBADO', 'RECHAZADO', 'CANCELADO');

CREATE TABLE "SaleVoidRequest" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "reason" VARCHAR(500) NOT NULL,
    "status" "SaleVoidRequestStatus" NOT NULL DEFAULT 'PENDIENTE',
    "rejectedReason" VARCHAR(500),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaleVoidRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserWorkSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" VARCHAR(5) NOT NULL,
    "endTime" VARCHAR(5) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserWorkSchedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserAttendance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "checkInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutAt" TIMESTAMP(3),
    "notas" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAttendance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserCommissionRule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "commissionPercent" DECIMAL(5,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCommissionRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserLeave" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" "UserLeaveType" NOT NULL,
    "estado" "UserLeaveStatus" NOT NULL DEFAULT 'SOLICITADO',
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "notas" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserLeave_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SaleVoidRequest_saleId_key" ON "SaleVoidRequest"("saleId");
CREATE INDEX "SaleVoidRequest_establishmentId_idx" ON "SaleVoidRequest"("establishmentId");
CREATE INDEX "SaleVoidRequest_status_idx" ON "SaleVoidRequest"("status");
CREATE INDEX "SaleVoidRequest_requestedById_idx" ON "SaleVoidRequest"("requestedById");

CREATE UNIQUE INDEX "UserWorkSchedule_userId_dayOfWeek_key" ON "UserWorkSchedule"("userId", "dayOfWeek");
CREATE INDEX "UserWorkSchedule_userId_idx" ON "UserWorkSchedule"("userId");

CREATE INDEX "UserAttendance_userId_idx" ON "UserAttendance"("userId");
CREATE INDEX "UserAttendance_establishmentId_idx" ON "UserAttendance"("establishmentId");
CREATE INDEX "UserAttendance_checkInAt_idx" ON "UserAttendance"("checkInAt");

CREATE INDEX "UserCommissionRule_userId_idx" ON "UserCommissionRule"("userId");
CREATE INDEX "UserCommissionRule_activo_idx" ON "UserCommissionRule"("activo");

CREATE INDEX "UserLeave_userId_idx" ON "UserLeave"("userId");
CREATE INDEX "UserLeave_estado_idx" ON "UserLeave"("estado");
CREATE INDEX "UserLeave_fromDate_idx" ON "UserLeave"("fromDate");

ALTER TABLE "SaleVoidRequest" ADD CONSTRAINT "SaleVoidRequest_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaleVoidRequest" ADD CONSTRAINT "SaleVoidRequest_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaleVoidRequest" ADD CONSTRAINT "SaleVoidRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaleVoidRequest" ADD CONSTRAINT "SaleVoidRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "UserWorkSchedule" ADD CONSTRAINT "UserWorkSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserAttendance" ADD CONSTRAINT "UserAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserAttendance" ADD CONSTRAINT "UserAttendance_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UserCommissionRule" ADD CONSTRAINT "UserCommissionRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserLeave" ADD CONSTRAINT "UserLeave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
