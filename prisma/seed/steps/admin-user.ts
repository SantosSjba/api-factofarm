import type { PrismaClient } from '../../../src/generated/prisma/client';
import { IdentityDocumentType, UserRole } from '../../../src/generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { adminDemoCredentials } from '../data/admin-demo';

const SALT_ROUNDS = 10;

const ADMIN_PERMISSION_CODES = [
  'users.read',
  'users.write',
  'nav.usuarios',
  'nav.establecimientos',
] as const;

export async function seedAdminUser(prisma: PrismaClient): Promise<void> {
  const { email, passwordPlain } = adminDemoCredentials;

  const estCentral = await prisma.establishment.findFirst({
    where: { codigo: 'EST-001' },
  });
  if (!estCentral) {
    throw new Error('Seed admin: falta establecimiento EST-001');
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    const hash = await bcrypt.hash(passwordPlain, SALT_ROUNDS);

    const admin = await prisma.user.create({
      data: {
        nombre: 'Administrador',
        email,
        passwordHash: hash,
        role: UserRole.ADMINISTRADOR,
        establecimientoId: estCentral.id,
        profile: {
          create: {
            tipoDocumento: IdentityDocumentType.DNI,
            numeroDocumento: '00000000',
            nombres: 'Admin',
            apellidos: 'Sistema',
            cargo: 'Administrador IT',
            emailCorporativo: email,
          },
        },
      },
    });

    await assignPermissionsToUser(prisma, admin.id);
    console.info('Seed: usuario administrador creado.');
  } else {
    await assignPermissionsToUser(prisma, existing.id);
    console.info('Seed: usuario administrador ya existía; permisos sincronizados.');
  }

  console.info('Seed completado. Credenciales demo (solo desarrollo):');
  console.info(`  ${email} / ${passwordPlain}`);
}

async function assignPermissionsToUser(
  prisma: PrismaClient,
  userId: string,
): Promise<void> {
  for (const code of ADMIN_PERMISSION_CODES) {
    const perm = await prisma.permission.findUnique({
      where: { code },
    });
    if (!perm) {
      console.warn(`Seed admin: falta permiso ${code}, omitiendo asignación.`);
      continue;
    }
    await prisma.userPermission.upsert({
      where: {
        userId_permissionId: { userId, permissionId: perm.id },
      },
      create: { userId, permissionId: perm.id },
      update: {},
    });
  }
}
