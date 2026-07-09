import type { PrismaClient } from '../../../src/generated/prisma/client';
import { seedAdminUser } from './admin-user';
import { seedBrands } from './brands';
import { seedCategories } from './categories';
import { seedCompoundProducts } from './compound-products';
import { seedCustomers } from './customers';
import { seedCustomerTypes } from './customer-types';
import { seedTenants, backfillTenantAssignments } from './tenants';
import { seedEstablishments } from './establishments';
import { seedInventoryMovements } from './inventory-movements';
import { seedProductCatalogs } from './product-catalogs';
import { seedProducts } from './products';
import { seedPermissions } from './permissions';
import { seedServices } from './services';
import { seedSeries } from './series';
import { seedUbigeo } from './ubigeo';
import { seedCashRegisters } from './cash-registers';
import { seedDrugInteractions } from './drug-interactions';
import { seedPharmaPhase6 } from './pharma-phase6';

async function runStep(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  console.log(`[seed] ▶ Iniciando: ${name}`);
  try {
    await fn();
    const ms = Date.now() - start;
    console.log(`[seed] ✓ Completado: ${name} (${ms}ms)`);
  } catch (error) {
    const ms = Date.now() - start;
    console.error(`[seed] ✗ Error en: ${name} (${ms}ms)`);
    throw error;
  }
}

export async function runSeedSteps(prisma: PrismaClient): Promise<void> {
  await runStep('Ubigeo', () => seedUbigeo(prisma));
  const { demoTenantId } = await (async () => {
    let tenantId = '';
    await runStep('Tenants', async () => {
      const result = await seedTenants(prisma);
      tenantId = result.demoTenantId;
    });
    return { demoTenantId: tenantId };
  })();
  await runStep('Establecimientos', () => seedEstablishments(prisma, demoTenantId));
  await runStep('Catálogos de productos', () => seedProductCatalogs(prisma));
  await runStep('Tipos de cliente', () => seedCustomerTypes(prisma, demoTenantId));
  await runStep('Categorías', () => seedCategories(prisma, demoTenantId));
  await runStep('Marcas', () => seedBrands(prisma, demoTenantId));
  await runStep('Productos', () => seedProducts(prisma, demoTenantId));
  await runStep('Conjuntos/Packs/Promociones', () => seedCompoundProducts(prisma, demoTenantId));
  await runStep('Servicios', () => seedServices(prisma, demoTenantId));
  await runStep('Series', () => seedSeries(prisma));
  await runStep('Inventario (lotes/series)', () => seedInventoryMovements(prisma));
  await runStep('Clientes', () => seedCustomers(prisma, demoTenantId));
  await runStep('Permisos', () => seedPermissions(prisma));
  await runStep('Backfill tenants', () => backfillTenantAssignments(prisma, demoTenantId));
  await runStep('Cajas POS', () => seedCashRegisters(prisma));
  await runStep('Interacciones farmacológicas', () => seedDrugInteractions(prisma));
  await runStep('Fase 6 pharma', () => seedPharmaPhase6(prisma));
  await runStep('Usuario admin', () => seedAdminUser(prisma));
}
