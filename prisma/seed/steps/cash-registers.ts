import type { PrismaClient } from '../../../src/generated/prisma/client';

export async function seedCashRegisters(prisma: PrismaClient): Promise<void> {
  const establishments = await prisma.establishment.findMany({
    where: { deletedAt: null },
    select: { id: true, codigo: true, nombre: true },
  });

  for (const est of establishments) {
    const existing = await prisma.cashRegister.findFirst({
      where: { establishmentId: est.id, deletedAt: null },
      select: { id: true },
    });
    if (existing) continue;

    await prisma.cashRegister.create({
      data: {
        establishmentId: est.id,
        nombre: `Caja principal · ${est.codigo}`,
        activo: true,
      },
    });
  }
}
