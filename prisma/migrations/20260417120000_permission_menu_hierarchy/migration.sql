-- Árbol de permisos alineado con el menú FactoFarm (padre + hijos).
ALTER TABLE "Permission" ADD COLUMN "label" TEXT;
ALTER TABLE "Permission" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Permission" ADD COLUMN "parentId" TEXT;

CREATE INDEX "Permission_parentId_idx" ON "Permission"("parentId");

ALTER TABLE "Permission" ADD CONSTRAINT "Permission_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Permission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
