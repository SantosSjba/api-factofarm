import type { PrismaClient } from '../../../src/generated/prisma/client';
import { seedAdminUser } from './admin-user';
import { seedEstablishments } from './establishments';
import { seedPermissions } from './permissions';

export async function runSeedSteps(prisma: PrismaClient): Promise<void> {
  await seedEstablishments(prisma);
  await seedPermissions(prisma);
  await seedAdminUser(prisma);
}
