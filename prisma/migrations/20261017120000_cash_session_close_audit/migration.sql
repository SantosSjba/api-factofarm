-- Gestión de cajas: quién cerró la sesión y cierre forzado por supervisor
ALTER TABLE "CashSession" ADD COLUMN "closedById" TEXT;
ALTER TABLE "CashSession" ADD COLUMN "cierreForzado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CashSession" ADD COLUMN "motivoCierreForzado" VARCHAR(500);

-- Las sesiones ya cerradas las cerró su propio cajero
UPDATE "CashSession" SET "closedById" = "userId" WHERE "estado" = 'CERRADA';

CREATE INDEX "CashSession_openedAt_idx" ON "CashSession"("openedAt");

ALTER TABLE "CashSession" ADD CONSTRAINT "CashSession_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
