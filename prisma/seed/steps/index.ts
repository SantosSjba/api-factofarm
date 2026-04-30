import type { PrismaClient } from '../../../src/generated/prisma/client';
import { seedAdminUser } from './admin-user';
import { seedBrands } from './brands';
import { seedCategories } from './categories';
import { seedCustomers } from './customers';
import { seedCustomerTypes } from './customer-types';
import { seedEstablishments } from './establishments';
import { seedProductCatalogs } from './product-catalogs';
import { seedProducts } from './products';
import { seedPermissions } from './permissions';
import { seedServices } from './services';
import { seedUbigeo } from './ubigeo';

export async function runSeedSteps(prisma: PrismaClient): Promise<void> {
  await seedUbigeo(prisma);
  await seedEstablishments(prisma);
  await seedProductCatalogs(prisma);
  await seedCustomerTypes(prisma);
  await seedCategories(prisma);
  await seedBrands(prisma);
  await seedProducts(prisma);
  await seedServices(prisma);
  await seedCustomers(prisma);
  await seedPermissions(prisma);
  await seedAdminUser(prisma);
}
