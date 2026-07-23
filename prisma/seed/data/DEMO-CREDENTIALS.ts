/**
 * Credenciales demo FactoFarm (desarrollo).
 * Se aplican con: `pnpm db:seed` o `pnpm db:reset`
 *
 * Dominio operadores: @factosysperu.com
 *
 * Plataforma
 * - superadmin@factosysperu.com / SuperAdmin123!
 * - platform@factosysperu.com / Platform123!
 *
 * Tenant "FactoFarm Demo" (slug: factofarm-demo)
 * - admin@factosysperu.com / Admin123!                    (ADMINISTRADOR)
 * - admin.cadena@factosysperu.com / Cadena123!            (ADMIN_CADENA)
 * - gerente@factosysperu.com / Gerente123!                (GERENTE_SUCURSAL · sucursal)
 * - farmaceutico.titular@factosysperu.com / Titular123!   (FARMACEUTICO_TITULAR)
 * - farmaceutico@factosysperu.com / Farma123!             (FARMACEUTICO)
 * - tecnico@factosysperu.com / Tecnico123!                (TECNICO_FARMACEUTICO)
 * - cajero@factosysperu.com / Cajero123!                  (CAJERO · sucursal)
 * - vendedor@factosysperu.com / Vendedor123!              (VENDEDOR · sucursal)
 * - almacenero@factosysperu.com / Almacen123!             (ALMACENERO)
 * - contador@factosysperu.com / Contador123!              (CONTADOR)
 *
 * Establecimientos: 0000 Oficina Principal · 0001 Sucursal
 * Catálogo demo: productos, lotes, clientes, series, cajas POS, CIE-10, médico.
 * Sin ventas/auditoría de prueba: la BD queda limpia salvo esta base demo.
 */
export { demoUsersSeed, adminDemoCredentials, superAdminDemoCredentials, demoCajeroCredentials } from './demo-users';
