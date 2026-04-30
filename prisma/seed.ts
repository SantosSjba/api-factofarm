import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { runSeedSteps } from './seed/steps';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL es obligatoria para el seed.');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const startedAt = Date.now();
  console.log('[seed] ===== Inicio de seed =====');
  await runSeedSteps(prisma);
  console.log(`[seed] ===== Seed finalizado correctamente (${Date.now() - startedAt}ms) =====`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('[seed] ===== Seed finalizó con error =====');
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
