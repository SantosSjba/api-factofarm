-- Catálogo de precios regulados por cliente. La tabla estaba vacía al crear esta migración;
-- si tuviera filas, el NOT NULL hace fallar la migración en lugar de asignarlas a un cliente al azar.
ALTER TABLE "RegulatedDrugPrice" ADD COLUMN "tenantId" TEXT NOT NULL;

CREATE INDEX "RegulatedDrugPrice_tenantId_codigoDigemid_idx" ON "RegulatedDrugPrice"("tenantId", "codigoDigemid");

ALTER TABLE "RegulatedDrugPrice" ADD CONSTRAINT "RegulatedDrugPrice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
