import { UserRole } from '../../generated/prisma/client';
import { MENU_NAV_LEAF_CODES } from '../../../prisma/seed/steps/permissions';

const POS_NAV = ['nav.punto_venta', 'nav.caja_chica_pos', 'nav.dashboard_admin'] as const;
const CLIENTES_NAV = ['nav.clientes_list', 'nav.tipo_clientes'] as const;
const INVENTARIO_NAV = [
  'nav.inventario_movimientos',
  'nav.traslados',
  'nav.lotes',
  'nav.reporte_kardex',
  'nav.reporte_inventario',
] as const;
const COMPRAS_NAV = [
  'nav.ordenes_compra',
  'nav.recepcion_mercaderia',
  'nav.proveedores',
] as const;
const FARMACIA_NAV = [
  'nav.recetas',
  'nav.medicos',
  'nav.reporte_psicotropicos',
  'nav.reporte_digemid',
  'nav.farmaceutico_titular',
] as const;
const FINANZAS_NAV = [
  'nav.finanzas_movimientos',
  'nav.cuentas_cobrar',
  'nav.cuentas_pagar',
  'nav.balance',
  'nav.conciliacion_bancaria',
] as const;
const CONTABILIDAD_NAV = [
  'nav.contabilidad_exportar_formatos',
  'nav.sire_ventas',
  'nav.sire_compras',
] as const;

const ROLE_NAV_TEMPLATES: Partial<Record<UserRole, readonly string[]>> = {
  [UserRole.CAJERO]: [...POS_NAV, 'nav.clientes_list'],
  [UserRole.VENDEDOR]: [...POS_NAV, 'nav.clientes_list'],
  [UserRole.TECNICO_FARMACEUTICO]: [
    ...POS_NAV,
    'nav.clientes_list',
    'nav.recetas',
    'nav.inventario_movimientos',
  ],
  [UserRole.FARMACEUTICO]: [
    ...POS_NAV,
    ...CLIENTES_NAV,
    ...FARMACIA_NAV,
    'nav.anulaciones',
    'nav.inventario_movimientos',
  ],
  [UserRole.FARMACEUTICO_TITULAR]: [
    ...POS_NAV,
    ...CLIENTES_NAV,
    ...FARMACIA_NAV,
    'nav.anulaciones',
    'nav.inventario_movimientos',
    'nav.reporte_psicotropicos',
  ],
  [UserRole.ALMACENERO]: [
    ...INVENTARIO_NAV,
    ...COMPRAS_NAV,
    'nav.dashboard_admin',
  ],
  [UserRole.CONTADOR]: [
    ...FINANZAS_NAV,
    ...CONTABILIDAD_NAV,
    'nav.contabilidad_resumen_venta',
    'nav.dashboard_admin',
  ],
  [UserRole.GERENTE_SUCURSAL]: [
    'nav.dashboard_admin',
    ...CLIENTES_NAV,
    'nav.productos',
    ...INVENTARIO_NAV,
    ...COMPRAS_NAV,
    ...FINANZAS_NAV,
    'nav.anulaciones',
    'nav.notas_venta',
    'nav.cotizaciones',
    'nav.usuarios',
    'nav.gestion_personal',
    'nav.reportes_panel',
  ],
};

const FULL_ACCESS_ROLES: ReadonlySet<UserRole> = new Set([
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN_CADENA,
  UserRole.ADMINISTRADOR,
]);

const PLATFORM_ONLY_NAV = new Set([
  'nav.platform_dashboard',
  'nav.platform_clientes',
  'nav.platform_leads',
  'nav.platform_reclamaciones',
]);

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super administrador',
  [UserRole.ADMIN_CADENA]: 'Admin cadena',
  [UserRole.GERENTE_SUCURSAL]: 'Gerente de sucursal',
  [UserRole.FARMACEUTICO_TITULAR]: 'Farmacéutico titular',
  [UserRole.FARMACEUTICO]: 'Farmacéutico',
  [UserRole.TECNICO_FARMACEUTICO]: 'Técnico farmacéutico',
  [UserRole.CAJERO]: 'Cajero',
  [UserRole.ALMACENERO]: 'Almacenero',
  [UserRole.CONTADOR]: 'Contador',
  [UserRole.ADMINISTRADOR]: 'Administrador',
  [UserRole.VENDEDOR]: 'Vendedor (cajero)',
};

export function getDefaultNavCodesForRole(role: UserRole): string[] {
  if (role === UserRole.SUPER_ADMIN) {
    return [...MENU_NAV_LEAF_CODES];
  }
  if (FULL_ACCESS_ROLES.has(role)) {
    return MENU_NAV_LEAF_CODES.filter((code) => !PLATFORM_ONLY_NAV.has(code));
  }
  const template = ROLE_NAV_TEMPLATES[role];
  if (!template) {
    return [...POS_NAV, 'nav.clientes_list'];
  }
  return [...template];
}

export function listRoleTemplates(): Array<{
  role: UserRole;
  label: string;
  navPermissionCodes: string[];
}> {
  const roles = Object.values(UserRole) as UserRole[];
  return roles.map((role) => ({
    role,
    label: ROLE_LABELS[role] ?? role,
    navPermissionCodes: getDefaultNavCodesForRole(role),
  }));
}
