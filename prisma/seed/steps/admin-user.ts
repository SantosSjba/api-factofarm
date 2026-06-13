import type { PrismaClient } from '../../../src/generated/prisma/client';
import { IdentityDocumentType, UserRole } from '../../../src/generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { expandUserPermissionCodes } from '../../../src/common/permissions/nav-permission-expansion';
import { getDefaultNavCodesForRole } from '../../../src/common/permissions/role-permission-templates';
import { adminDemoCredentials } from '../data/admin-demo';
import { demoCajeroCredentials } from '../data/demo-cajero';
import { superAdminDemoCredentials } from '../data/super-admin-demo';

const SALT_ROUNDS = 10;

const SUPER_ADMIN_PERMISSION_CODES = expandUserPermissionCodes(
  getDefaultNavCodesForRole(UserRole.SUPER_ADMIN),
  UserRole.SUPER_ADMIN,
);

const CAJERO_PERMISSION_CODES = expandUserPermissionCodes(
  getDefaultNavCodesForRole(UserRole.CAJERO),
  UserRole.CAJERO,
);

export async function seedAdminUser(prisma: PrismaClient): Promise<void> {
  const estCentral = await prisma.establishment.findFirst({
    where: { codigo: '0000' },
  });
  if (!estCentral) {
    throw new Error('Seed admin: falta establecimiento 0000 (Oficina Principal)');
  }

  await seedSuperAdmin(prisma, estCentral.id);

  const { email, passwordPlain } = adminDemoCredentials;

  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    const hash = await bcrypt.hash(passwordPlain, SALT_ROUNDS);

    const admin = await prisma.user.create({
      data: {
        nombre: 'Administrador',
        email,
        passwordHash: hash,
        role: UserRole.ADMINISTRADOR,
        tenantId: estCentral.tenantId,
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

    await syncPermissionCodesToUser(
      prisma,
      admin.id,
      expandUserPermissionCodes(getDefaultNavCodesForRole(UserRole.ADMINISTRADOR), UserRole.ADMINISTRADOR),
    );
    console.info('Seed: usuario administrador creado.');
  } else {
    await prisma.user.update({
      where: { id: existing.id },
      data: { establecimientoId: estCentral.id, tenantId: estCentral.tenantId },
    });
    await syncPermissionCodesToUser(
      prisma,
      existing.id,
      expandUserPermissionCodes(getDefaultNavCodesForRole(UserRole.ADMINISTRADOR), UserRole.ADMINISTRADOR),
    );
  console.info('Seed: usuario administrador ya existía; establecimiento y permisos sincronizados.');
  }

  console.info('Seed completado. Credenciales demo (solo desarrollo):');
  console.info(`  ${email} / ${passwordPlain}`);

  await seedDemoCajero(prisma);
}

async function seedDemoCajero(prisma: PrismaClient): Promise<void> {
  const { email, passwordPlain } = demoCajeroCredentials;
  const estSucursal = await prisma.establishment.findFirst({ where: { codigo: '0001' } });
  if (!estSucursal) {
    console.warn('Seed cajero: falta establecimiento 0001');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const hash = await bcrypt.hash(passwordPlain, SALT_ROUNDS);
    const cajero = await prisma.user.create({
      data: {
        nombre: 'Cajero Demo',
        email,
        passwordHash: hash,
        role: UserRole.CAJERO,
        tenantId: estSucursal.tenantId,
        establecimientoId: estSucursal.id,
        profile: {
          create: {
            tipoDocumento: IdentityDocumentType.DNI,
            numeroDocumento: '11111111',
            nombres: 'Cajero',
            apellidos: 'Demo',
            cargo: 'Cajero',
            emailCorporativo: email,
          },
        },
      },
    });
    await syncPermissionCodesToUser(prisma, cajero.id, CAJERO_PERMISSION_CODES);
    console.info('Seed: usuario cajero demo creado (sucursal 0001).');
  } else {
    await prisma.user.update({
      where: { id: existing.id },
      data: { establecimientoId: estSucursal.id, tenantId: estSucursal.tenantId, role: UserRole.CAJERO },
    });
    await syncPermissionCodesToUser(prisma, existing.id, CAJERO_PERMISSION_CODES);
    console.info('Seed: cajero demo sincronizado.');
  }
  console.info(`  ${email} / ${passwordPlain}`);
}

async function seedSuperAdmin(prisma: PrismaClient, establishmentId: string): Promise<void> {
  const { email, passwordPlain } = superAdminDemoCredentials;
  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    const hash = await bcrypt.hash(passwordPlain, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        nombre: 'Super Admin FactoFarm',
        email,
        passwordHash: hash,
        role: UserRole.SUPER_ADMIN,
        tenantId: null,
        establecimientoId: establishmentId,
      },
    });
    await syncPermissionCodesToUser(prisma, user.id, SUPER_ADMIN_PERMISSION_CODES);
    console.info('Seed: super administrador de plataforma creado.');
  } else {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: UserRole.SUPER_ADMIN,
        tenantId: null,
        establecimientoId: establishmentId,
      },
    });
    await syncPermissionCodesToUser(prisma, existing.id, SUPER_ADMIN_PERMISSION_CODES);
    console.info('Seed: super administrador sincronizado.');
  }
  console.info(`  ${email} / ${passwordPlain}`);
}

/** Asigna permisos por código al usuario demo. */
async function syncPermissionCodesToUser(
  prisma: PrismaClient,
  userId: string,
  codes: string[],
): Promise<void> {
  const permissions = await prisma.permission.findMany({
    where: { code: { in: codes } },
    select: { id: true },
  });
  await prisma.userPermission.deleteMany({ where: { userId } });
  if (permissions.length === 0) return;
  await prisma.userPermission.createMany({
    data: permissions.map((p) => ({ userId, permissionId: p.id })),
    skipDuplicates: true,
  });
}
