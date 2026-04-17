import type { PrismaClient } from '../../../src/generated/prisma/client';
import { IdentityDocumentType, UserRole } from '../../../src/generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { adminDemoCredentials } from '../data/admin-demo';

const SALT_ROUNDS = 10;

export async function seedAdminUser(prisma: PrismaClient): Promise<void> {
  const { email, passwordPlain } = adminDemoCredentials;

  const estCentral = await prisma.establishment.findFirst({
    where: { codigo: 'EST-001' },
  });
  if (!estCentral) {
    throw new Error('Seed admin: falta establecimiento EST-001');
  }

  const permUsersRead = await prisma.permission.findUnique({
    where: { code: 'users.read' },
  });
  if (!permUsersRead) {
    throw new Error('Seed admin: falta permiso users.read');
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

    await prisma.userPermission.create({
      data: {
        userId: admin.id,
        permissionId: permUsersRead.id,
      },
    });

    console.info('Seed: usuario administrador creado.');
  } else {
    console.info('Seed: usuario administrador ya existía, omitiendo creación.');
  }

  console.info('Seed completado. Credenciales demo (solo desarrollo):');
  console.info(`  ${email} / ${passwordPlain}`);
}
