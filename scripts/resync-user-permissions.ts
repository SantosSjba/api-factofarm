/**
 * Quita a cada usuario los permisos técnicos que ya no se derivan de sus ítems de menú
 * (p. ej. `establishments.write` que antes daba «Farmacéutico titular»).
 * Solo QUITA permisos; nunca agrega. Los ítems de menú (`nav.*`) no se tocan.
 *
 * Uso:
 *   npx tsx scripts/resync-user-permissions.ts --tenant <slug>            # simulación
 *   npx tsx scripts/resync-user-permissions.ts --tenant <slug> --apply    # guarda
 *   npx tsx scripts/resync-user-permissions.ts --all [--apply]           # todos los clientes
 *
 * Usa DATABASE_URL: revisa la base que imprime antes de usar --apply.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole } from '../src/generated/prisma/client';
import { expandUserPermissionCodes } from '../src/common/permissions/nav-permission-expansion';

const APPLY = process.argv.includes('--apply');
const ALL = process.argv.includes('--all');
const tenantArg = process.argv.indexOf('--tenant');
const SLUG = tenantArg > 0 ? process.argv[tenantArg + 1] : undefined;
if (!ALL && !SLUG) {
  console.error('Uso: resync-user-permissions.ts --tenant <slug> | --all [--apply]');
  process.exit(1);
}

const url = process.env.DATABASE_URL!;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

async function main() {
  console.log(`Base: ${url.replace(/\/\/[^@]*@/, '//').split('?')[0]}`);
  console.log(`${ALL ? 'Todos los clientes' : `Cliente: ${SLUG}`} · ${APPLY ? 'GUARDANDO (--apply)' : 'simulación'}\n`);

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      role: { not: UserRole.SUPER_ADMIN },
      ...(ALL ? {} : { tenant: { slug: SLUG } }),
    },
    select: {
      id: true,
      nombre: true,
      email: true,
      role: true,
      tenant: { select: { slug: true } },
      permissions: { select: { permissionId: true, permission: { select: { code: true } } } },
    },
    orderBy: { nombre: 'asc' },
  });

  const changes: { user: (typeof users)[number]; remove: { permissionId: string; code: string }[] }[] = [];
  for (const user of users) {
    const stored = user.permissions.map((p) => ({ permissionId: p.permissionId, code: p.permission.code }));
    const nav = stored.map((p) => p.code).filter((c) => c.startsWith('nav.'));
    if (!nav.length) continue; // sin menú no se puede derivar nada: no se toca
    const desired = new Set(expandUserPermissionCodes(nav, user.role));
    const remove = stored.filter((p) => !p.code.startsWith('nav.') && !desired.has(p.code));
    if (remove.length) changes.push({ user, remove });
  }

  if (!changes.length) {
    console.log(`Revisados ${users.length} usuarios: ninguno tiene permisos de más. Nada que hacer.`);
    return;
  }
  console.table(
    changes.map((c) => ({
      cliente: c.user.tenant?.slug ?? '—',
      usuario: c.user.nombre.slice(0, 30),
      correo: c.user.email,
      rol: c.user.role,
      quitar: c.remove.map((r) => r.code).join(', '),
    })),
  );
  console.log(`\n${changes.length} de ${users.length} usuarios con permisos de más.`);

  if (!APPLY) {
    console.log('Simulación: vuelve a correr con --apply para guardar.');
    return;
  }
  await prisma.$transaction(async (tx) => {
    for (const c of changes) {
      await tx.userPermission.deleteMany({
        where: { userId: c.user.id, permissionId: { in: c.remove.map((r) => r.permissionId) } },
      });
    }
  });
  console.log(`\nListo: permisos actualizados en ${changes.length} usuarios. Cada uno los verá al volver a iniciar sesión.`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
