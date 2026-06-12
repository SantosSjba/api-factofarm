import { UserRole } from '../../generated/prisma/client';
import { MENU_NAV_LEAF_CODES } from '../../../prisma/seed/steps/permissions';

/**
 * Cada ítem `nav.*` del menú implica acceso funcional completo al módulo (lectura + escritura).
 * Mantener alineado con `prisma/seed/steps/permissions.ts` (MENU_GROUPS children).
 */
export const NAV_TO_RBAC_EXPANSION: Readonly<Record<string, readonly string[]>> = {
  'nav.usuarios': ['users.read', 'users.write'],
  'nav.establecimientos': ['establishments.read', 'establishments.write'],
  'nav.clientes_list': ['customers.read', 'customers.write', 'customers.delete'],
  'nav.tipo_clientes': ['customer-types.read', 'customer-types.write'],
  'nav.productos': ['products.read', 'products.write', 'products.delete'],
  'nav.categorias': ['categories.read', 'categories.write'],
  'nav.marcas': ['brands.read', 'brands.write'],
  'nav.laboratorios': ['laboratories.read', 'laboratories.write'],
  'nav.unidades': ['units.read', 'units.write'],
  'nav.formas_farmaceuticas': ['pharma-forms.read', 'pharma-forms.write'],
  'nav.principios_activos': ['active-principles.read', 'active-principles.write'],
  'nav.vias_administracion': ['admin-routes.read', 'admin-routes.write'],
  'nav.proveedores': ['suppliers.read', 'suppliers.write'],
  'nav.inventario_movimientos': ['inventory.read', 'inventory.write'],
  'nav.traslados': ['inventory.read', 'inventory.write'],
  'nav.lotes': ['inventory.read', 'inventory.write'],
  'nav.salida_venta_lotes': ['inventory.read', 'inventory.write'],
  'nav.reporte_kardex': ['inventory.read'],
  'nav.reporte_inventario': ['inventory.read'],
  'nav.kardex_valorizado': ['inventory.read'],
  'nav.devolucion_retiro': ['inventory.read', 'inventory.write', 'inventory.adjust'],
  'nav.cadena_frio': ['inventory.read', 'inventory.write'],
  'nav.punto_venta': ['sales.read', 'sales.write', 'cash.open'],
  'nav.caja_chica_pos': ['cash.open', 'cash.close', 'sales.read'],
  'nav.notas_venta': ['sales.read'],
  'nav.anulaciones': ['sales.read', 'sales.void'],
  'nav.cotizaciones': ['sales.read', 'sales.write'],
  'nav.ordenes_compra': ['purchases.read', 'purchases.write'],
  'nav.recepcion_mercaderia': ['purchases.read', 'purchases.receive'],
  'nav.reporte_compras_sugerido': ['purchases.read'],
  'nav.comparativo_precios': ['purchases.read'],
  'nav.cuentas_pagar': ['purchases.read', 'purchases.write'],
};

const MENU_NAV_CODES = new Set(MENU_NAV_LEAF_CODES);

/** Códigos `nav.*` reconocidos en el catálogo de menú. */
export function isNavPermissionCode(code: string): boolean {
  return MENU_NAV_CODES.has(code);
}

/**
 * Normaliza la lista enviada desde el front (solo `nav.*` seleccionados) y expande RBAC técnico.
 */
export function expandUserPermissionCodes(codes: string[], role: UserRole): string[] {
  const set = new Set(codes.map((c) => c.trim()).filter(Boolean));

  for (const code of [...set]) {
    if (!code.startsWith('nav.')) {
      continue;
    }
    const implied = NAV_TO_RBAC_EXPANSION[code];
    if (implied) {
      for (const rbac of implied) {
        set.add(rbac);
      }
    }
  }

  set.add('users.read');
  if (role === UserRole.ADMINISTRADOR) {
    set.add('users.write');
  }

  return [...set].sort();
}

/** Para la UI: deja solo códigos de menú al editar checkboxes. */
export function extractNavPermissionCodes(codes: string[]): string[] {
  return codes.filter((c) => isNavPermissionCode(c));
}
