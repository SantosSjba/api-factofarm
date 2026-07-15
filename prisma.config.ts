import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Prisma ORM 7 — configuración en la raíz del proyecto (no en schema.prisma).
 *
 * Multi-file schema:
 * - `schema: 'prisma'` indica la carpeta del esquema: se fusionan `prisma/schema.prisma`
 *   y todos los `*.prisma` dentro (p. ej. `prisma/models/*.prisma`).
 * - No hay `import` entre archivos `.prisma`; Prisma compone un único esquema lógico.
 *
 * DATABASE_URL real viene del runtime (Coolify / .env). En build/CI usamos un
 * placeholder para que `prisma generate` no falle sin secretos.
 *
 * @see https://www.prisma.io/docs/orm/prisma-schema/overview/location#multi-file-prisma-schema
 */
const databaseUrl =
  process.env.DATABASE_URL?.trim() ||
  'postgresql://prisma:prisma@127.0.0.1:5432/prisma?schema=public';

export default defineConfig({
  schema: 'prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: databaseUrl,
  },
});
