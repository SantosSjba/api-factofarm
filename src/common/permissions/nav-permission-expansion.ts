import { UserRole } from '../../generated/prisma/client';
import { hasChainScope } from './role-policy.util';
import { MENU_NAV_LEAF_CODES } from '../../../prisma/seed/steps/permissions';

/**
 * Cada ítem `nav.*` del menú implica acceso funcional completo al módulo (lectura + escritura).
 * Mantener alineado con `prisma/seed/steps/permissions.ts` (MENU_GROUPS children).
 */
export const NAV_TO_RBAC_EXPANSION: Readonly<Record<string, readonly string[]>> = {
  'nav.usuarios': ['users.read', 'users.write', 'audit.read'],
  'nav.auditoria': ['audit.read'],
  'nav.establecimientos': ['establishments.read', 'establishments.write'],
  'nav.lpdp': ['compliance.read', 'compliance.write', 'customers.read'],
  'nav.farmaceutico_titular': ['compliance.read', 'compliance.write', 'establishments.read', 'establishments.write'],
  'nav.precios_regulados': ['compliance.read', 'compliance.write', 'products.read', 'products.write'],
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
  'nav.traslados': ['inventory.read', 'inventory.write', 'inventory.transfer.cross'],
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
  'nav.promociones': ['promotions.read', 'promotions.write'],
  'nav.ordenes_pedido': ['delivery.read', 'delivery.write'],
  'nav.ordenes_compra': ['purchases.read', 'purchases.write'],
  'nav.recepcion_mercaderia': ['purchases.read', 'purchases.receive'],
  'nav.reporte_compras_sugerido': ['purchases.read'],
  'nav.comparativo_precios': ['purchases.read'],
  'nav.cuentas_pagar': ['purchases.read', 'purchases.write'],
  'nav.comprobante_electronico': ['billing.read', 'billing.write'],
  'nav.resumenes': ['billing.read', 'billing.write'],
  'nav.medicos': ['medicos.read', 'medicos.write'],
  'nav.recetas': ['prescriptions.read', 'prescriptions.write'],
  'nav.cie_10': ['pharmaceutical.read'],
  'nav.reporte_psicotropicos': ['pharmaceutical.read'],
  'nav.reporte_digemid': ['pharmaceutical.read'],
  'nav.recepcion_productos_farmaceuticos': ['pharmaceutical.read', 'pharmaceutical.write'],
  'nav.gestion_personal': ['staff.read', 'staff.write'],
  'nav.hospital_dispensacion': ['hospital.read', 'hospital.write'],
  'nav.retenciones': ['compliance.read', 'billing.read', 'billing.write'],
  'nav.percepciones': ['compliance.read', 'billing.read', 'billing.write'],
  'nav.convenios': ['agreements.read', 'agreements.write'],
  'nav.gr_remitente': ['shipping.read', 'inventory.read', 'inventory.write', 'billing.read', 'billing.write'],
  'nav.gr_transportista': ['shipping.read', 'shipping.write', 'billing.read', 'billing.write'],
  'nav.transportistas': ['shipping.read', 'shipping.write'],
  'nav.conductores': ['shipping.read', 'shipping.write'],
  'nav.vehiculos': ['shipping.read', 'shipping.write'],
  'nav.direcciones_partida': ['shipping.read', 'shipping.write'],
  'nav.reportes_panel': ['pharmaceutical.read', 'inventory.read', 'finance.read', 'compliance.read'],
  'nav.contabilidad_exportar_reporte': ['finance.read', 'compliance.read'],
  'nav.contabilidad_resumen_venta': ['finance.read'],
  'nav.contabilidad_exportar_formatos': ['compliance.read', 'billing.read'],
  'nav.contabilidad_reporte_resumido': ['finance.read'],
  'nav.libro_mayor': ['finance.read'],
  'nav.sire_ventas': ['compliance.read', 'billing.read'],
  'nav.sire_compras': ['compliance.read', 'billing.read', 'purchases.read'],
  'nav.finanzas_movimientos': ['finance.read'],
  'nav.transacciones': ['finance.read'],
  'nav.finanzas_ingresos': ['finance.read', 'finance.write'],
  'nav.cuentas_cobrar': ['finance.read', 'finance.write'],
  'nav.pagos': ['finance.read'],
  'nav.balance': ['finance.read'],
  'nav.conciliacion_bancaria': ['finance.read', 'finance.write'],
  'nav.ingresos_egresos_medio_pago': ['finance.read'],
  'nav.platform_clientes': ['tenants.read', 'tenants.write'],
  'nav.platform_leads': ['tenants.read'],
  'nav.platform_reclamaciones': ['complaints.read', 'complaints.write'],
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
  if (hasChainScope(role)) {
    set.add('users.write');
  }

  return [...set].sort();
}

/** Para la UI: deja solo códigos de menú al editar checkboxes. */
export function extractNavPermissionCodes(codes: string[]): string[] {
  return codes.filter((c) => isNavPermissionCode(c));
}
