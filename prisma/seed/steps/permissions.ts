import type { PrismaClient } from '../../../src/generated/prisma/client';

/**
 * Permisos técnicos (RBAC) + nodo de menú `nav.*` alineado con el sidebar FactoFarm.
 */
export async function seedPermissions(prisma: PrismaClient): Promise<void> {
  const rbac: { code: string; description: string }[] = [
    { code: 'users.read', description: 'Listar y ver usuarios' },
    { code: 'users.write', description: 'Crear y editar usuarios' },
  ];

  for (const row of rbac) {
    await prisma.permission.upsert({
      where: { code: row.code },
      update: { description: row.description },
      create: { ...row, sortOrder: 0 },
    });
  }

  const parent = await prisma.permission.upsert({
    where: { code: 'nav.usuarios_series' },
    update: {
      label: 'Usuarios & Series',
      sortOrder: 0,
      description: 'Agrupador del menú lateral (FactoFarm)',
    },
    create: {
      code: 'nav.usuarios_series',
      description: 'Agrupador del menú lateral (FactoFarm)',
      label: 'Usuarios & Series',
      sortOrder: 0,
    },
  });

  const children: { code: string; label: string; sortOrder: number }[] = [
    { code: 'nav.usuarios', label: 'Usuarios', sortOrder: 1 },
    { code: 'nav.establecimientos', label: 'Establecimientos', sortOrder: 2 },
  ];

  for (const c of children) {
    await prisma.permission.upsert({
      where: { code: c.code },
      update: {
        parentId: parent.id,
        label: c.label,
        sortOrder: c.sortOrder,
        description: `Acceso al ítem de menú: ${c.label}`,
      },
      create: {
        code: c.code,
        parentId: parent.id,
        label: c.label,
        sortOrder: c.sortOrder,
        description: `Acceso al ítem de menú: ${c.label}`,
      },
    });
  }
}
