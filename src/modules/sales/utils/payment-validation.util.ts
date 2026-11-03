import { BadRequestException } from '@nestjs/common';
import { PaymentMethod, Prisma } from '../../../generated/prisma/client';

/** Medios que pueden exigir código de operación (y lo exigen por defecto). */
export const CONFIGURABLE_REFERENCE_METHODS: PaymentMethod[] = [
  PaymentMethod.YAPE,
  PaymentMethod.PLIN,
  PaymentMethod.TARJETA,
  PaymentMethod.TRANSFERENCIA,
];

export const PAYMENT_METHODS_REQUIRING_REFERENCE = CONFIGURABLE_REFERENCE_METHODS;

export const INVALID_SPLIT_PAYMENT_METHODS: PaymentMethod[] = [
  PaymentMethod.MIXTO,
];

export type SalePaymentInput = {
  metodo: PaymentMethod;
  monto: number | string | Prisma.Decimal;
  referencia?: string | null;
};

/**
 * `required` es la lista configurada en el establecimiento
 * (`posPaymentReferenceMethods`); sin ella se usa la regla por defecto.
 */
export function paymentRequiresReference(
  metodo: PaymentMethod,
  required: readonly PaymentMethod[] = PAYMENT_METHODS_REQUIRING_REFERENCE,
): boolean {
  return required.includes(metodo);
}

export function validateSalePayments(
  payments: SalePaymentInput[],
  saleTotal: Prisma.Decimal,
  requiredReferenceMethods?: readonly PaymentMethod[],
): void {
  if (!payments.length) {
    throw new BadRequestException('Debe registrar al menos un pago');
  }

  for (const payment of payments) {
    if (INVALID_SPLIT_PAYMENT_METHODS.includes(payment.metodo)) {
      throw new BadRequestException(
        'Para pagos mixtos registre una línea por cada medio (efectivo, Yape, etc.)',
      );
    }
    if (
      paymentRequiresReference(payment.metodo, requiredReferenceMethods) &&
      !payment.referencia?.trim()
    ) {
      throw new BadRequestException(
        `Ingrese el código o N° de operación para el pago con ${payment.metodo}`,
      );
    }
  }

  const paymentsTotal = payments.reduce(
    (acc, payment) => acc.plus(new Prisma.Decimal(payment.monto)),
    new Prisma.Decimal(0),
  );
  if (!paymentsTotal.equals(saleTotal)) {
    throw new BadRequestException(
      'Los pagos no coinciden con el total de la venta',
    );
  }
}
