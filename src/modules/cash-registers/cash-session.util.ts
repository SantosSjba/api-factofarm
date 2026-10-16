import { BadRequestException } from '@nestjs/common';
import {
  CashMovementType,
  CashSessionStatus,
  PaymentMethod,
  Prisma,
} from '../../generated/prisma/client';
import { paymentRequiresReference } from '../sales/utils/payment-validation.util';

type Db = Pick<Prisma.TransactionClient, 'cashSession' | 'cashMovement'>;

/** Efectivo que debería haber en la gaveta: sólo cuentan los movimientos en efectivo. */
export async function cashOnHand(
  db: Db,
  cashSessionId: string,
): Promise<Prisma.Decimal> {
  const agg = await db.cashMovement.aggregate({
    where: {
      cashSessionId,
      metodoPago: PaymentMethod.EFECTIVO,
      tipo: { not: CashMovementType.CIERRE },
    },
    _sum: { monto: true },
  });
  return agg._sum.monto ?? new Prisma.Decimal(0);
}

/**
 * Normaliza el medio de pago de un cobro/pago manual (texto libre heredado) al catálogo.
 * Devuelve null si no corresponde a un medio conocido.
 */
export function normalizePaymentMethod(
  metodo: string | null | undefined,
): PaymentMethod | null {
  const key = (metodo ?? '').trim().toUpperCase();
  if (!key) return null;
  return (Object.values(PaymentMethod) as string[]).includes(key)
    ? (key as PaymentMethod)
    : null;
}

export function assertPaymentReference(
  metodo: PaymentMethod | null,
  referencia: string | null | undefined,
): void {
  if (metodo && paymentRequiresReference(metodo) && !referencia?.trim()) {
    throw new BadRequestException(
      `Ingrese el código o N° de operación para el pago con ${metodo}`,
    );
  }
}

/**
 * Un cobro o pago en efectivo debe pasar por la caja abierta del usuario; si no, el arqueo
 * no cuadra. Registra el movimiento (positivo = ingreso, negativo = egreso).
 */
export async function registerCashFlow(
  db: Db,
  input: {
    establishmentId: string;
    userId: string;
    monto: Prisma.Decimal;
    comentario: string;
    referencia?: string | null;
  },
): Promise<void> {
  const session = await db.cashSession.findFirst({
    where: {
      userId: input.userId,
      estado: CashSessionStatus.ABIERTA,
      cashRegister: { establishmentId: input.establishmentId, deletedAt: null },
    },
    select: { id: true },
  });
  if (!session) {
    throw new BadRequestException(
      'Para registrar un movimiento en efectivo abra primero su caja (o use otro medio de pago).',
    );
  }
  if (input.monto.isNegative()) {
    const available = await cashOnHand(db, session.id);
    if (input.monto.abs().greaterThan(available)) {
      throw new BadRequestException(
        `Efectivo insuficiente en caja: disponible S/ ${available.toFixed(2)}, requerido S/ ${input.monto.abs().toFixed(2)}.`,
      );
    }
  }
  await db.cashMovement.create({
    data: {
      cashSessionId: session.id,
      tipo: input.monto.isNegative()
        ? CashMovementType.EGRESO
        : CashMovementType.INGRESO,
      monto: input.monto,
      metodoPago: PaymentMethod.EFECTIVO,
      referencia: input.referencia?.trim() || null,
      comentario: input.comentario,
    },
  });
}
