import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { runSeedSteps } from './seed/steps';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL es obligatoria para el seed.');
}

function assertSeedAllowed(dbUrl: string) {
  const nodeEnv = (process.env.NODE_ENV ?? '').toLowerCase();
  const normalized = dbUrl.toLowerCase();
  const looksProd =
    nodeEnv === 'production' ||
    normalized.includes('prod') ||
    normalized.includes('production') ||
    normalized.includes('coolify') ||
    /[?&]sslmode=require/.test(normalized);
  if (looksProd && process.env.SEED_ALLOW_PRODUCTION !== 'true') {
    throw new Error(
      'Seed bloqueado: entorno/DB parece producción. Defina SEED_ALLOW_PRODUCTION=true para forzar (peligroso).',
    );
  }
}

assertSeedAllowed(connectionString);

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
