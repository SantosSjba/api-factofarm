import { TenantPlan } from '../../generated/prisma/client';
import { MENU_NAV_LEAF_CODES } from '../../../prisma/seed/steps/permissions';

export type TenantPlanLimits = {
  maxEstablishments: number;
  maxUsers: number;
};

const PLATFORM_NAV = new Set([
  'nav.platform_clientes',
  'nav.platform_leads',
  'nav.platform_reclamaciones',
]);

const TENANT_NAV_CODES = MENU_NAV_LEAF_CODES.filter((code) => !PLATFORM_NAV.has(code));

const BOTICA_MODULES: readonly string[] = [
  'nav.dashboard_admin',
  'nav.usuarios',
  'nav.establecimientos',
  'nav.auditoria',
  'nav.clientes_list',
  'nav.tipo_clientes',
  'nav.productos',
  'nav.categorias',
  'nav.marcas',
  'nav.laboratorios',
  'nav.unidades',
  'nav.formas_farmaceuticas',
  'nav.principios_activos',
  'nav.vias_administracion',
  'nav.proveedores',
  'nav.ordenes_compra',
  'nav.recepcion_mercaderia',
  'nav.punto_venta',
  'nav.caja_chica_pos',
  'nav.notas_venta',
  'nav.cotizaciones',
  'nav.inventario_movimientos',
  'nav.lotes',
  'nav.reporte_kardex',
  'nav.reporte_inventario',
];

const FARMACIA_PRO_MODULES: readonly string[] = [
  ...BOTICA_MODULES,
  'nav.lpdp',
  'nav.farmaceutico_titular',
  'nav.precios_regulados',
  'nav.conjuntos_packs',
  'nav.servicios',
  'nav.series',
  'nav.zonas',
  'nav.comprobante_electronico',
  'nav.resumenes',
  'nav.anulaciones',
  'nav.promociones',
  'nav.convenios',
  'nav.traslados',
  'nav.devolucion_retiro',
  'nav.cadena_frio',
  'nav.medicos',
  'nav.recetas',
  'nav.reporte_psicotropicos',
  'nav.recepcion_productos_farmaceuticos',
  'nav.gestion_personal',
  'nav.finanzas_movimientos',
  'nav.cuentas_cobrar',
];

export function limitsForPlan(plan: TenantPlan): TenantPlanLimits {
  switch (plan) {
    case TenantPlan.BOTICA:
      return { maxEstablishments: 1, maxUsers: 3 };
    case TenantPlan.FARMACIA_PRO:
      return { maxEstablishments: 1, maxUsers: 10 };
    case TenantPlan.CADENA:
      return { maxEstablishments: 20, maxUsers: 50 };
    case TenantPlan.CUSTOM:
    default:
      return { maxEstablishments: 1, maxUsers: 3 };
  }
}

export function modulesForPlan(plan: TenantPlan): string[] {
  switch (plan) {
    case TenantPlan.CADENA:
      return [...TENANT_NAV_CODES];
    case TenantPlan.FARMACIA_PRO:
      return [...FARMACIA_PRO_MODULES];
    case TenantPlan.CUSTOM:
      return [...TENANT_NAV_CODES];
    case TenantPlan.BOTICA:
    default:
      return [...BOTICA_MODULES];
  }
}

export function parseTenantEnabledModules(raw: unknown): string[] | null {
  if (raw == null) {
    return null;
  }
  if (!Array.isArray(raw)) {
    return null;
  }
  const codes = raw
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.startsWith('nav.') && TENANT_NAV_CODES.includes(item));
  return [...new Set(codes)];
}

export function resolveTenantEnabledModules(input: {
  plan: TenantPlan;
  enabledModules: unknown;
}): string[] {
  const custom = parseTenantEnabledModules(input.enabledModules);
  if (custom !== null) {
    return custom;
  }
  return modulesForPlan(input.plan);
}

export function slugifyTenantName(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return base || 'cliente';
}

export const TENANT_PLAN_LABELS: Record<TenantPlan, string> = {
  [TenantPlan.BOTICA]: 'Botica',
  [TenantPlan.FARMACIA_PRO]: 'Farmacia Pro',
  [TenantPlan.CADENA]: 'Cadena',
  [TenantPlan.CUSTOM]: 'Personalizado',
};

export { TENANT_NAV_CODES };
