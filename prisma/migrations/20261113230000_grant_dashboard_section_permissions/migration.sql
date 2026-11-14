-- Quien ya entraba al panel general (nav.dashboard_admin) sigue viendo todas sus secciones:
-- se le asignan los permisos de sección creados en 20261113160000. Idempotente.
INSERT INTO "user_permissions" ("userId", "permissionId")
SELECT up."userId", s."id"
FROM "user_permissions" up
JOIN "Permission" adm ON adm."id" = up."permissionId" AND adm."code" = 'nav.dashboard_admin'
CROSS JOIN "Permission" s
WHERE s."code" IN (
  'nav.dashboard_ventas',
  'nav.dashboard_margenes',
  'nav.dashboard_caja',
  'nav.dashboard_inventario',
  'nav.dashboard_cuentas'
)
ON CONFLICT DO NOTHING;
