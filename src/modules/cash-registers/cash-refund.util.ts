import { BadRequestException } from '@nestjs/common';
import { CashSessionStatus, Prisma } from '../../generated/prisma/client';
import { cashOnHand } from './cash-session.util';

type Db = Pick<Prisma.TransactionClient, 'cashSession' | 'cashMovement'>;

/**
 * Caja de la que sale el efectivo al anular o devolver una venta.
 * - Si la caja en que se cobró sigue abierta, sale de esa.
 * - Si ya se cerró (p. ej. una venta de ayer), sale de la caja abierta de quien anula o devuelve:
 *   el arqueo ya cerrado no se toca y el efectivo se descuenta del turno actual.
 * En ambos casos tiene que haber efectivo suficiente en la gaveta.
 */
export async function resolveRefundCashSession(
  db: Db,
  input: {
    saleCashSessionId: string;
    userId: string;
    establishmentId: string;
    amount: Prisma.Decimal;
  },
): Promise<{ cashSessionId: string; fromOtherSession: boolean }> {
  const original = await db.cashSession.findFirst({
    where: { id: input.saleCashSessionId, estado: CashSessionStatus.ABIERTA },
    select: { id: true },
  });

  let cashSessionId = original?.id ?? null;
  if (!cashSessionId) {
    const mine = await db.cashSession.findFirst({
      where: {
        userId: input.userId,
        estado: CashSessionStatus.ABIERTA,
        cashRegister: { establishmentId: input.establishmentId },
      },
      orderBy: { openedAt: 'desc' },
      select: { id: true },
    });
    if (!mine) {
      throw new BadRequestException(
        `La caja en que se cobró esta venta ya está cerrada. Abre tu caja para devolver S/ ${input.amount.toFixed(2)} en efectivo.`,
      );
    }
    cashSessionId = mine.id;
  }

  const available = await cashOnHand(db, cashSessionId);
  if (input.amount.greaterThan(available)) {
    throw new BadRequestException(
      `No hay efectivo suficiente en ${original ? 'la caja de la venta' : 'tu caja'}: hay S/ ${available.toFixed(2)} y se deben devolver S/ ${input.amount.toFixed(2)}.`,
    );
  }

  return { cashSessionId, fromOtherSession: !original };
}
