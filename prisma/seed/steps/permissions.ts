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
];

const MENU_GROUPS: MenuGroup[] = [
  {
    code: 'nav.usuarios_series',
    label: 'Usuarios & Establecimientos',
    sortOrder: 1,
    children: [
      { code: 'nav.usuarios', label: 'Usuarios', sortOrder: 1 },
      { code: 'nav.establecimientos', label: 'Establecimientos', sortOrder: 2 },
    ],
  },
  {
    code: 'nav.clientes',
    label: 'Clientes',
    sortOrder: 2,
    children: [
      { code: 'nav.clientes_list', label: 'Clientes', sortOrder: 1 },
      { code: 'nav.tipo_clientes', label: 'Tipos de Clientes', sortOrder: 2 },
    ],
  },
  {
    code: 'nav.productos_catalogo',
    label: 'Productos / Catálogo',
    sortOrder: 3,
    children: [
      { code: 'nav.productos', label: 'Productos', sortOrder: 1 },
      { code: 'nav.categorias', label: 'Categorías', sortOrder: 2 },
      { code: 'nav.marcas', label: 'Marcas', sortOrder: 3 },
      { code: 'nav.laboratorios', label: 'Laboratorios', sortOrder: 4 },
      { code: 'nav.unidades', label: 'Unidades', sortOrder: 5 },
      { code: 'nav.formas_farmaceuticas', label: 'Formas farmacéuticas', sortOrder: 6 },
      { code: 'nav.principios_activos', label: 'Principios activos', sortOrder: 7 },
      { code: 'nav.vias_administracion', label: 'Vías de administración', sortOrder: 8 },
    ],
  },
  {
    code: 'nav.compras',
    label: 'Compras',
    sortOrder: 4,
    children: [{ code: 'nav.proveedores', label: 'Proveedores', sortOrder: 1 }],
  },
];

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
