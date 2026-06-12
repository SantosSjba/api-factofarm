import type { PrismaClient } from '../../../src/generated/prisma/client';

const CONTROLLED = [
  { codigo: 'I', nombre: 'Estupefacientes', schedule: 'I' },
  { codigo: 'II', nombre: 'Psicotrópicos schedule II', schedule: 'II' },
  { codigo: 'III', nombre: 'Psicotrópicos schedule III', schedule: 'III' },
  { codigo: 'IV', nombre: 'Psicotrópicos schedule IV', schedule: 'IV' },
];

const CIE10 = [
  { codigo: 'J06.9', descripcion: 'Infección aguda de vías respiratorias superiores, no especificada' },
  { codigo: 'K29.7', descripcion: 'Gastritis, no especificada' },
  { codigo: 'M54.5', descripcion: 'Lumbago no especificado' },
  { codigo: 'R51', descripcion: 'Cefalea' },
  { codigo: 'Z00.0', descripcion: 'Examen médico general' },
];

export async function seedPharmaPhase6(prisma: PrismaClient): Promise<void> {
  for (const row of CONTROLLED) {
    await prisma.controlledSubstanceCategory.upsert({
      where: { codigo: row.codigo },
      update: { nombre: row.nombre, schedule: row.schedule, activo: true, deletedAt: null },
      create: row,
    });
  }

  for (const row of CIE10) {
    await prisma.cie10Code.upsert({
      where: { codigo: row.codigo },
      update: { descripcion: row.descripcion, activo: true, deletedAt: null },
      create: row,
    });
  }

  await prisma.medico.upsert({
    where: { cmp: '123456' },
    update: { nombres: 'JUAN', apellidos: 'PEREZ GARCIA', especialidad: 'Medicina General', activo: true },
    create: {
      cmp: '123456',
      nombres: 'JUAN',
      apellidos: 'PEREZ GARCIA',
      especialidad: 'Medicina General',
    },
  });

  console.log(`   ✅ ${CONTROLLED.length} categorías controladas, ${CIE10.length} CIE-10, médico demo`);
}
