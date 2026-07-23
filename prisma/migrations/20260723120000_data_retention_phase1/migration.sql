-- Fase 1 retención: índices para purga/consultas por tenant+fecha y métricas
CREATE INDEX IF NOT EXISTS "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "InventoryInboundMovement_warehouseId_fechaRegistro_idx" ON "InventoryInboundMovement"("warehouseId", "fechaRegistro");
CREATE INDEX IF NOT EXISTS "ElectronicDocument_establishmentId_createdAt_idx" ON "ElectronicDocument"("establishmentId", "createdAt");

-- Registro de corridas de retención
CREATE TABLE IF NOT EXISTS "DataRetentionRun" (
    "id" TEXT NOT NULL,
    "jobName" VARCHAR(80) NOT NULL,
    "mode" VARCHAR(20) NOT NULL,
    "cutoffAt" TIMESTAMP(3) NOT NULL,
    "deletedCount" INTEGER NOT NULL DEFAULT 0,
    "details" JSONB,
    "status" VARCHAR(20) NOT NULL,
    "errorMessage" VARCHAR(1000),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "DataRetentionRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DataRetentionRun_jobName_startedAt_idx" ON "DataRetentionRun"("jobName", "startedAt");
CREATE INDEX IF NOT EXISTS "DataRetentionRun_startedAt_idx" ON "DataRetentionRun"("startedAt");
