-- Secciones del panel general como ítems del árbol de permisos (bajo «Dashboard»).
-- Idempotente: el seed hace lo mismo con upsert.
INSERT INTO "Permission" ("id", "code", "label", "description", "sortOrder", "parentId")
SELECT gen_random_uuid()::text, v.code, v.label, 'Acceso al ítem de menú: ' || v.label, v.sort,
       (SELECT "id" FROM "Permission" WHERE "code" = 'nav.dashboard')
FROM (VALUES
  ('nav.dashboard_ventas', 'Panel general: ventas', 2),
  ('nav.dashboard_margenes', 'Panel general: costos y ganancia', 3),
  ('nav.dashboard_caja', 'Panel general: caja y gastos', 4),
  ('nav.dashboard_inventario', 'Panel general: inventario', 5),
  ('nav.dashboard_cuentas', 'Panel general: cuentas por cobrar y pagar', 6)
) AS v(code, label, sort)
ON CONFLICT ("code") DO NOTHING;
