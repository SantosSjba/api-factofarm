import type { PrismaClient } from '../../../src/generated/prisma/client';
import { IdentityDocumentType, UserRole } from '../../../src/generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { expandUserPermissionCodes } from '../../../src/common/permissions/nav-permission-expansion';
import {
  getDefaultNavCodesForRole,
  ROLE_LABELS,
} from '../../../src/common/permissions/role-permission-templates';
import { demoUsersSeed, type DemoUserSeed } from '../data/demo-users';

const SALT_ROUNDS = 10;

export async function seedAdminUser(prisma: PrismaClient): Promise<void> {
  const establishments = await prisma.establishment.findMany({
    where: { codigo: { in: ['0000', '0001'] } },
    select: { id: true, codigo: true, tenantId: true },
  });
  const byCode = new Map(
    establishments
      .filter((e): e is { id: string; codigo: string; tenantId: string } => !!e.codigo)
      .map((e) => [e.codigo, e]),
  );
  if (!byCode.get('0000') || !byCode.get('0001')) {
    throw new Error('Seed usuarios: faltan establecimientos 0000 y/o 0001');
  }

  console.info('Seed: roles del sistema y usuarios demo (@factosysperu.com)');
  for (const role of Object.values(UserRole)) {
    const navCount = getDefaultNavCodesForRole(role).length;
    console.info(`  · ${ROLE_LABELS[role] ?? role}: ${navCount} ítems de menú por plantilla`);
  }

  for (const demo of demoUsersSeed) {
    await upsertDemoUser(prisma, demo, byCode);
  }

  console.info('Seed completado. Credenciales demo (solo desarrollo):');
  for (const demo of demoUsersSeed) {
    console.info(`  ${demo.email} / ${demo.passwordPlain}  [${demo.role}]`);
  }
}

async function upsertDemoUser(
  prisma: PrismaClient,
  demo: DemoUserSeed,
  byCode: Map<string, { id: string; codigo: string; tenantId: string }>,
): Promise<void> {
  const est = byCode.get(demo.establishmentCode);
  if (!est) {
    throw new Error(`Seed usuarios: establecimiento ${demo.establishmentCode} no encontrado`);
  }

  const permissionCodes = expandUserPermissionCodes(
    getDefaultNavCodesForRole(demo.role),
    demo.role,
  );
  const hash = await bcrypt.hash(demo.passwordPlain, SALT_ROUNDS);
  const tenantId = demo.tenantScoped ? est.tenantId : null;

  const existing = await prisma.user.findUnique({ where: { email: demo.email } });

  if (!existing) {
    const user = await prisma.user.create({
      data: {
        nombre: demo.nombre,
        email: demo.email,
        passwordHash: hash,
        role: demo.role,
        tenantId,
        establecimientoId: est.id,
        ...(demo.profile
          ? {
              profile: {
                create: {
                  tipoDocumento: IdentityDocumentType.DNI,
                  numeroDocumento: demo.profile.numeroDocumento,
                  nombres: demo.profile.nombres,
                  apellidos: demo.profile.apellidos,
                  cargo: demo.profile.cargo,
                  emailCorporativo: demo.email,
                },
              },
            }
          : {}),
      },
    });
    await syncPermissionCodesToUser(prisma, user.id, permissionCodes);
    console.info(`  ✓ creado ${demo.email} (${demo.role})`);
    return;
  }

  await prisma.user.update({
    where: { id: existing.id },
    data: {
      nombre: demo.nombre,
      passwordHash: hash,
      role: demo.role,
      tenantId,
      establecimientoId: est.id,
      deletedAt: null,
    },
  });

  if (demo.profile) {
    await prisma.userProfile.upsert({
      where: { userId: existing.id },
      update: {
        numeroDocumento: demo.profile.numeroDocumento,
        nombres: demo.profile.nombres,
        apellidos: demo.profile.apellidos,
        cargo: demo.profile.cargo,
        emailCorporativo: demo.email,
      },
      create: {
        userId: existing.id,
        tipoDocumento: IdentityDocumentType.DNI,
        numeroDocumento: demo.profile.numeroDocumento,
        nombres: demo.profile.nombres,
        apellidos: demo.profile.apellidos,
        cargo: demo.profile.cargo,
        emailCorporativo: demo.email,
      },
    });
  }

  await syncPermissionCodesToUser(prisma, existing.id, permissionCodes);
  console.info(`  ✓ sincronizado ${demo.email} (${demo.role})`);
}

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
