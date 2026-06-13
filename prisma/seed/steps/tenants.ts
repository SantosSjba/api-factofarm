import type { PrismaClient } from '../../../src/generated/prisma/client';
import { TenantPlan, TenantStatus } from '../../../src/generated/prisma/client';
import { limitsForPlan } from '../../../src/common/tenants/tenant-plan.util';

export async function seedTenants(prisma: PrismaClient): Promise<{ demoTenantId: string }> {
  const preset = limitsForPlan(TenantPlan.CADENA);

  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'factofarm-demo' },
    update: {
      nombre: 'FactoFarm Demo',
      plan: TenantPlan.CADENA,
      status: TenantStatus.ACTIVE,
      maxEstablishments: preset.maxEstablishments,
      maxUsers: preset.maxUsers,
    },
    create: {
      nombre: 'FactoFarm Demo',
      slug: 'factofarm-demo',
      plan: TenantPlan.CADENA,
      status: TenantStatus.ACTIVE,
      maxEstablishments: preset.maxEstablishments,
      maxUsers: preset.maxUsers,
      contactEmail: 'empresa@factofarm.local',
      activatedAt: new Date(),
    },
    select: { id: true },
  });

  return { demoTenantId: demoTenant.id };
}

export async function backfillTenantAssignments(
  prisma: PrismaClient,
  demoTenantId: string,
): Promise<void> {
  await prisma.establishment.updateMany({
    data: { tenantId: demoTenantId },
  });

  await prisma.user.updateMany({
    where: { role: { not: 'SUPER_ADMIN' } },
    data: { tenantId: demoTenantId },
  });
}
