import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

/**
 * Prisma ORM 7 — configuración en la raíz del proyecto (no en schema.prisma).
 *
 * Multi-file schema:
 * - `schema: 'prisma'` indica la carpeta del esquema: se fusionan `prisma/schema.prisma`
 *   y todos los `*.prisma` dentro (p. ej. `prisma/models/*.prisma`).
 * - No hay `import` entre archivos `.prisma`; Prisma compone un único esquema lógico.
 *
 * Reglas para modularizar sin errores:
 * - Un solo `generator` y un solo `datasource` (solo en `prisma/schema.prisma`).
 * - Nombres de modelos únicos en todo el proyecto (no repetir el mismo `model` en dos archivos).
 * - Nuevos dominios = nuevos `prisma/models/mi-dominio.prisma` (se incluyen automáticamente).
 * - Variables: `DATABASE_URL` debe existir al ejecutar `prisma generate`, `migrate`, etc.
 *
 * @see https://www.prisma.io/docs/orm/prisma-schema/overview/location#multi-file-prisma-schema
 */
export default defineConfig({
  schema: 'prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
