-- B-LOG-10/11: metadata de sesión soporte en RefreshToken
ALTER TABLE "RefreshToken" ADD COLUMN IF NOT EXISTS "supportSession" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RefreshToken" ADD COLUMN IF NOT EXISTS "supportTenantId" TEXT;
ALTER TABLE "RefreshToken" ADD COLUMN IF NOT EXISTS "supportEstablishmentId" TEXT;
ALTER TABLE "RefreshToken" ADD COLUMN IF NOT EXISTS "supportRole" "UserRole";

-- B-PER-10: codigo de establecimiento único por tenant (no global)
DROP INDEX IF EXISTS "Establishment_codigo_key";

-- Si hay duplicados (mismo tenant + mismo codigo), conservar el más antiguo y anular el resto
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "tenantId", codigo
      ORDER BY "createdAt" ASC, id ASC
    ) AS rn
  FROM "Establishment"
  WHERE codigo IS NOT NULL
)
UPDATE "Establishment" e
SET codigo = NULL
FROM ranked r
WHERE e.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS "Establishment_tenantId_codigo_key"
  ON "Establishment"("tenantId", "codigo");
