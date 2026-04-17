import type { PrismaClient } from '../../../src/generated/prisma/client';
import { permissionsData } from '../data/permissions';

export async function seedPermissions(prisma: PrismaClient): Promise<void> {
  for (const row of permissionsData) {
    await prisma.permission.upsert({
      where: { code: row.code },
      update: {},
      create: row,
    });
  }
}
