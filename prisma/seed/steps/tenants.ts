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
      contactEmail: 'empresa@factosysperu.com',
      activatedAt: new Date(),
    },
    select: { id: true },
  });

  return { demoTenantId: demoTenant.id };
}

/**
 * Asigna tenant demo solo a filas sin tenant.
 * Catálogos/entidades con `tenantId` obligatorio ya lo reciben en sus seeds de create;
 * no se reescribe para no clobber otros tenants.
 */
export async function backfillTenantAssignments(
  prisma: PrismaClient,
  demoTenantId: string,
): Promise<void> {
  await prisma.user.updateMany({
    where: { role: { not: 'SUPER_ADMIN' }, tenantId: null },
    data: { tenantId: demoTenantId },
  });
}
