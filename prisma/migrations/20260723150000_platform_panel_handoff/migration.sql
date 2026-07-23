-- Handoff de un solo uso: SUPER_ADMIN entra al panel de un tenant SaaS
CREATE TABLE IF NOT EXISTS "PlatformPanelHandoff" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformPanelHandoff_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PlatformPanelHandoff_codeHash_key" ON "PlatformPanelHandoff"("codeHash");
CREATE INDEX IF NOT EXISTS "PlatformPanelHandoff_expiresAt_idx" ON "PlatformPanelHandoff"("expiresAt");
CREATE INDEX IF NOT EXISTS "PlatformPanelHandoff_tenantId_idx" ON "PlatformPanelHandoff"("tenantId");
CREATE INDEX IF NOT EXISTS "PlatformPanelHandoff_actorUserId_idx" ON "PlatformPanelHandoff"("actorUserId");
