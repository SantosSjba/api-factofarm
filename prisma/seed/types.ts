/** Tipos compartidos entre data/ y steps/ del seed (sin depender de Prisma en datos puros). */
import type { PrismaClient } from '../../src/generated/prisma/client';

export type SeedEstablishmentInput = {
  nombre: string;
  codigo: string;
  activo: boolean;
};

export type SeedDb = PrismaClient;
