/** Tipos compartidos entre data/ y steps/ del seed (sin depender de Prisma en datos puros). */
export type SeedEstablishmentInput = {
  nombre: string;
  codigo: string;
  activo: boolean;
};

