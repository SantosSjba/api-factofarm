import type { PrismaClient } from '../../../src/generated/prisma/client';
import { IdentityDocumentType, UserRole } from '../../../src/generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { adminDemoCredentials } from '../data/admin-demo';

const SALT_ROUNDS = 10;

export async function seedAdminUser(prisma: PrismaClient): Promise<void> {
  const { email, passwordPlain } = adminDemoCredentials;

  const estCentral = await prisma.establishment.findFirst({
    where: { codigo: '0000' },
  });
  if (!estCentral) {
    throw new Error('Seed admin: falta establecimiento 0000 (Oficina Principal)');
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

    await syncAllPermissionsToUser(prisma, admin.id);
    console.info('Seed: usuario administrador creado.');
  } else {
    await syncAllPermissionsToUser(prisma, existing.id);
    console.info('Seed: usuario administrador ya existía; permisos sincronizados.');
  }

  console.info('Seed completado. Credenciales demo (solo desarrollo):');
  console.info(`  ${email} / ${passwordPlain}`);
}

/** Asigna todos los permisos del catálogo al admin demo (desarrollo). */
async function syncAllPermissionsToUser(
  prisma: PrismaClient,
  userId: string,
): Promise<void> {
  const permissions = await prisma.permission.findMany({ select: { id: true } });
  await prisma.userPermission.deleteMany({ where: { userId } });
  if (permissions.length === 0) return;

  await prisma.userPermission.createMany({
    data: permissions.map((p) => ({ userId, permissionId: p.id })),
    skipDuplicates: true,
  });
}
