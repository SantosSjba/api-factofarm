import type { PrismaClient } from '../../../src/generated/prisma/client';
import { seedAdminUser } from './admin-user';
import { seedBrands } from './brands';
import { seedCategories } from './categories';
import { seedCompoundProducts } from './compound-products';
import { seedCustomers } from './customers';
import { seedCustomerTypes } from './customer-types';
import { seedEstablishments } from './establishments';
import { seedProductCatalogs } from './product-catalogs';
import { seedProducts } from './products';
import { seedPermissions } from './permissions';
import { seedServices } from './services';
import { seedSeries } from './series';
import { seedUbigeo } from './ubigeo';

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
  await runStep('Establecimientos', () => seedEstablishments(prisma));
  await runStep('Catálogos de productos', () => seedProductCatalogs(prisma));
  await runStep('Tipos de cliente', () => seedCustomerTypes(prisma));
  await runStep('Categorías', () => seedCategories(prisma));
  await runStep('Marcas', () => seedBrands(prisma));
  await runStep('Productos', () => seedProducts(prisma));
  await runStep('Conjuntos/Packs/Promociones', () => seedCompoundProducts(prisma));
  await runStep('Servicios', () => seedServices(prisma));
  await runStep('Series', () => seedSeries(prisma));
  await runStep('Clientes', () => seedCustomers(prisma));
  await runStep('Permisos', () => seedPermissions(prisma));
  await runStep('Usuario admin', () => seedAdminUser(prisma));
}
