import type { PrismaClient } from '../../../src/generated/prisma/client';

type RbacRow = { code: string; description: string };

type MenuGroup = {
  code: string;
  label: string;
  sortOrder: number;
  children: { code: string; label: string; sortOrder: number }[];
};

const RBAC: RbacRow[] = [
  { code: 'users.read', description: 'Listar y ver usuarios' },
  { code: 'users.write', description: 'Crear y editar usuarios' },
  { code: 'establishments.read', description: 'Listar y ver establecimientos' },
  { code: 'establishments.write', description: 'Crear y editar establecimientos' },
  { code: 'customers.read', description: 'Listar y ver clientes' },
  { code: 'customers.write', description: 'Crear y editar clientes' },
  { code: 'customers.delete', description: 'Eliminar clientes' },
  { code: 'customer-types.read', description: 'Listar tipos de cliente' },
  { code: 'customer-types.write', description: 'Crear y editar tipos de cliente' },
  { code: 'categories.read', description: 'Listar categorías' },
  { code: 'categories.write', description: 'Crear y editar categorías' },
  { code: 'brands.read', description: 'Listar marcas' },
  { code: 'brands.write', description: 'Crear y editar marcas' },
  { code: 'products.read', description: 'Listar y ver productos' },
  { code: 'products.write', description: 'Crear y editar productos' },
  { code: 'products.delete', description: 'Eliminar productos' },
  { code: 'suppliers.read', description: 'Listar y ver proveedores' },
  { code: 'suppliers.write', description: 'Crear y editar proveedores' },
  { code: 'laboratories.read', description: 'Listar laboratorios' },
  { code: 'laboratories.write', description: 'Crear y editar laboratorios' },
  { code: 'pharma-forms.read', description: 'Listar formas farmacéuticas' },
  { code: 'pharma-forms.write', description: 'Crear y editar formas farmacéuticas' },
  { code: 'active-principles.read', description: 'Listar principios activos' },
  { code: 'active-principles.write', description: 'Crear y editar principios activos' },
  { code: 'units.read', description: 'Listar unidades de medida' },
  { code: 'units.write', description: 'Crear y editar unidades de medida' },
  { code: 'admin-routes.read', description: 'Listar vías de administración' },
  { code: 'admin-routes.write', description: 'Crear y editar vías de administración' },
  { code: 'inventory.read', description: 'Consultar inventario, lotes y kardex' },
  { code: 'inventory.write', description: 'Registrar ingresos, salidas y transferencias' },
  { code: 'inventory.adjust', description: 'Ajustes de inventario y autorizaciones especiales' },
  { code: 'sales.read', description: 'Consultar ventas y cotizaciones' },
  { code: 'sales.write', description: 'Registrar ventas y cotizaciones' },
  { code: 'sales.void', description: 'Anular ventas' },
  { code: 'cash.open', description: 'Apertura de caja y movimientos' },
  { code: 'cash.close', description: 'Cierre de caja y arqueo' },
  { code: 'purchases.read', description: 'Consultar órdenes de compra, AP y reportes' },
  { code: 'purchases.write', description: 'Crear OC, pagos y notas de crédito proveedor' },
  { code: 'purchases.receive', description: 'Recepción de mercadería contra OC' },
  { code: 'billing.read', description: 'Consultar comprobantes electrónicos y configuración OSE' },
  { code: 'billing.write', description: 'Emitir y configurar facturación electrónica' },
  { code: 'billing.void', description: 'Anular comprobantes y comunicaciones de baja SUNAT' },
  { code: 'medicos.read', description: 'Consultar médicos prescriptores' },
  { code: 'medicos.write', description: 'Registrar y editar médicos' },
  { code: 'prescriptions.read', description: 'Consultar recetas médicas' },
  { code: 'prescriptions.write', description: 'Registrar recetas y dispensación' },
  { code: 'pharmaceutical.read', description: 'Consultar controlados, farmacovigilancia y reportes pharma' },
  { code: 'pharmaceutical.write', description: 'Registrar eventos adversos y movimientos pharma' },
];

export const MENU_GROUPS: MenuGroup[] = [
  {
    code: 'nav.dashboard',
    label: 'Dashboard',
    sortOrder: 1,
    children: [{ code: 'nav.dashboard_admin', label: 'Dashboard Admin', sortOrder: 1 }],
  },
  {
    code: 'nav.usuarios_series',
    label: 'Usuarios & Establecimientos',
    sortOrder: 2,
    children: [
      { code: 'nav.usuarios', label: 'Usuarios', sortOrder: 1 },
      { code: 'nav.establecimientos', label: 'Establecimientos', sortOrder: 2 },
    ],
  },
  {
    code: 'nav.clientes',
    label: 'Clientes',
    sortOrder: 3,
    children: [
      { code: 'nav.clientes_list', label: 'Clientes', sortOrder: 1 },
      { code: 'nav.tipo_clientes', label: 'Tipos de Clientes', sortOrder: 2 },
    ],
  },
  {
    code: 'nav.productos_catalogo',
    label: 'Productos / Servicios',
    sortOrder: 4,
    children: [
      { code: 'nav.productos', label: 'Productos', sortOrder: 1 },
      { code: 'nav.conjuntos_packs', label: 'Conjuntos/Packs/Promociones', sortOrder: 2 },
      { code: 'nav.servicios', label: 'Servicios', sortOrder: 3 },
      { code: 'nav.categorias', label: 'Categorías', sortOrder: 4 },
      { code: 'nav.marcas', label: 'Marcas', sortOrder: 5 },
      { code: 'nav.laboratorios', label: 'Laboratorios', sortOrder: 6 },
      { code: 'nav.unidades', label: 'Unidades', sortOrder: 7 },
      { code: 'nav.formas_farmaceuticas', label: 'Formas farmacéuticas', sortOrder: 8 },
      { code: 'nav.principios_activos', label: 'Principios activos', sortOrder: 9 },
      { code: 'nav.vias_administracion', label: 'Vías de administración', sortOrder: 10 },
      { code: 'nav.series', label: 'Series', sortOrder: 11 },
      { code: 'nav.zonas', label: 'Zonas', sortOrder: 12 },
      { code: 'nav.importar_precios', label: 'Importar Precios', sortOrder: 13 },
    ],
  },
  {
    code: 'nav.compras',
    label: 'Compras',
    sortOrder: 5,
    children: [
      { code: 'nav.proveedores', label: 'Proveedores', sortOrder: 1 },
      { code: 'nav.ordenes_compra', label: 'Órdenes de compra', sortOrder: 2 },
      { code: 'nav.recepcion_mercaderia', label: 'Recepción mercadería', sortOrder: 3 },
      { code: 'nav.reporte_compras_sugerido', label: 'Sugerido de compras', sortOrder: 4 },
      { code: 'nav.comparativo_precios', label: 'Comparativo precios', sortOrder: 5 },
    ],
  },
  {
    code: 'nav.pos',
    label: 'POS',
    sortOrder: 6,
    children: [
      { code: 'nav.punto_venta', label: 'Punto de Venta', sortOrder: 1 },
      { code: 'nav.caja_chica_pos', label: 'Caja Chica POS', sortOrder: 2 },
    ],
  },
  {
    code: 'nav.ventas',
    label: 'Ventas',
    sortOrder: 7,
    children: [
      { code: 'nav.comprobante_electronico', label: 'Comprobante electrónico', sortOrder: 1 },
      { code: 'nav.notas_venta', label: 'Notas de venta', sortOrder: 2 },
      { code: 'nav.resumenes', label: 'Resúmenes', sortOrder: 3 },
      { code: 'nav.anulaciones', label: 'Anulaciones', sortOrder: 4 },
      { code: 'nav.cotizaciones', label: 'Cotizaciones', sortOrder: 5 },
    ],
  },
  {
    code: 'nav.inventario',
    label: 'Inventario',
    sortOrder: 8,
    children: [
      { code: 'nav.inventario_movimientos', label: 'Movimientos', sortOrder: 1 },
      { code: 'nav.traslados', label: 'Traslados', sortOrder: 2 },
      { code: 'nav.devolucion_retiro', label: 'Devolución-retiro', sortOrder: 3 },
      { code: 'nav.reporte_kardex', label: 'Reporte Kardex', sortOrder: 4 },
      { code: 'nav.reporte_inventario', label: 'Reporte Inventario', sortOrder: 5 },
      { code: 'nav.kardex_valorizado', label: 'Kardex valorizado', sortOrder: 6 },
      { code: 'nav.lotes', label: 'Lotes', sortOrder: 7 },
      { code: 'nav.salida_venta_lotes', label: 'Salida venta (lotes)', sortOrder: 8 },
      { code: 'nav.cadena_frio', label: 'Cadena de frío', sortOrder: 9 },
    ],
  },
  {
    code: 'nav.comprobantes_avanzados',
    label: 'Comprobantes Avanzados',
    sortOrder: 9,
    children: [
      { code: 'nav.retenciones', label: 'Retenciones', sortOrder: 1 },
      { code: 'nav.percepciones', label: 'Percepciones', sortOrder: 2 },
      { code: 'nav.ordenes_pedido', label: 'Órdenes de pedido', sortOrder: 3 },
    ],
  },
  {
    code: 'nav.guias_remision',
    label: 'Guías de remisión',
    sortOrder: 10,
    children: [
      { code: 'nav.gr_remitente', label: 'G.R. Remitente', sortOrder: 1 },
      { code: 'nav.gr_transportista', label: 'G.R. Transportista', sortOrder: 2 },
      { code: 'nav.transportistas', label: 'Transportistas', sortOrder: 3 },
      { code: 'nav.conductores', label: 'Conductores', sortOrder: 4 },
      { code: 'nav.vehiculos', label: 'Vehículos', sortOrder: 5 },
      { code: 'nav.direcciones_partida', label: 'Direcciones de partida', sortOrder: 6 },
    ],
  },
  {
    code: 'nav.reportes',
    label: 'Reportes',
    sortOrder: 11,
    children: [{ code: 'nav.reportes_panel', label: 'Reportes', sortOrder: 1 }],
  },
  {
    code: 'nav.contabilidad',
    label: 'Contabilidad',
    sortOrder: 12,
    children: [
      { code: 'nav.contabilidad_exportar_reporte', label: 'Exportar Reporte', sortOrder: 1 },
      { code: 'nav.contabilidad_resumen_venta', label: 'Resumen de venta', sortOrder: 2 },
      { code: 'nav.contabilidad_exportar_formatos', label: 'Exportar formatos sistema contable', sortOrder: 3 },
      { code: 'nav.contabilidad_reporte_resumido', label: 'Reporte resumido de ventas', sortOrder: 4 },
      { code: 'nav.libro_mayor', label: 'Libro Mayor', sortOrder: 5 },
      { code: 'nav.sire_ventas', label: 'SIRE Ventas', sortOrder: 6 },
      { code: 'nav.sire_compras', label: 'SIRE Compras', sortOrder: 7 },
    ],
  },
  {
    code: 'nav.finanzas',
    label: 'Finanzas',
    sortOrder: 13,
    children: [
      { code: 'nav.finanzas_movimientos', label: 'Movimientos', sortOrder: 1 },
      { code: 'nav.transacciones', label: 'Transacciones', sortOrder: 2 },
      { code: 'nav.finanzas_ingresos', label: 'Ingresos', sortOrder: 3 },
      { code: 'nav.cuentas_cobrar', label: 'Cuentas por cobrar', sortOrder: 4 },
      { code: 'nav.cuentas_pagar', label: 'Cuentas por pagar', sortOrder: 5 },
      { code: 'nav.pagos', label: 'Pagos', sortOrder: 6 },
      { code: 'nav.balance', label: 'Balance', sortOrder: 7 },
      { code: 'nav.ingresos_egresos_medio_pago', label: 'Ingresos y Egresos M. pago', sortOrder: 8 },
    ],
  },
  {
    code: 'nav.farmacos',
    label: 'Fármacos',
    sortOrder: 14,
    children: [
      { code: 'nav.reporte_digemid', label: 'Reporte Digemid', sortOrder: 1 },
      { code: 'nav.recetas', label: 'Recetas', sortOrder: 2 },
      { code: 'nav.medicos', label: 'Médicos', sortOrder: 3 },
      { code: 'nav.cie_10', label: 'CIE 10', sortOrder: 4 },
      {
        code: 'nav.reporte_psicotropicos',
        label: 'Reporte psicotrópicos y estupefacientes',
        sortOrder: 5,
      },
      {
        code: 'nav.recepcion_productos_farmaceuticos',
        label: 'Recepción productos farmacéuticos',
        sortOrder: 6,
      },
    ],
  },
];

/** Códigos `nav.*` asignables (hojas del árbol de permisos). */
export const MENU_NAV_LEAF_CODES = MENU_GROUPS.flatMap((g) =>
  g.children.map((c) => c.code),
);

/**
 * Permisos técnicos (RBAC) + nodos `nav.*` alineados con el sidebar FactoFarm.
 */
export async function seedPermissions(prisma: PrismaClient): Promise<void> {
  for (const row of RBAC) {
    await prisma.permission.upsert({
      where: { code: row.code },
      update: { description: row.description },
      create: { ...row, sortOrder: 0 },
    });
  }

  for (const group of MENU_GROUPS) {
    const parent = await prisma.permission.upsert({
      where: { code: group.code },
      update: {
        label: group.label,
        sortOrder: group.sortOrder,
        description: `Agrupador del menú lateral: ${group.label}`,
      },
      create: {
        code: group.code,
        label: group.label,
        sortOrder: group.sortOrder,
        description: `Agrupador del menú lateral: ${group.label}`,
      },
    });

    for (const child of group.children) {
      await prisma.permission.upsert({
        where: { code: child.code },
        update: {
          parentId: parent.id,
          label: child.label,
          sortOrder: child.sortOrder,
          description: `Acceso al ítem de menú: ${child.label}`,
        },
        create: {
          code: child.code,
          parentId: parent.id,
          label: child.label,
          sortOrder: child.sortOrder,
          description: `Acceso al ítem de menú: ${child.label}`,
        },
      });
    }
  }
}
