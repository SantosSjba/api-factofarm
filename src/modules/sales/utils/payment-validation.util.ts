import { BadRequestException } from '@nestjs/common';
import { PaymentMethod, Prisma } from '../../../generated/prisma/client';

export const PAYMENT_METHODS_REQUIRING_REFERENCE: PaymentMethod[] = [
  PaymentMethod.YAPE,
  PaymentMethod.PLIN,
  PaymentMethod.TARJETA,
  PaymentMethod.TRANSFERENCIA,
];

export const INVALID_SPLIT_PAYMENT_METHODS: PaymentMethod[] = [PaymentMethod.MIXTO];

export type SalePaymentInput = {
  metodo: PaymentMethod;
  monto: number | string | Prisma.Decimal;
  referencia?: string | null;
};

export function paymentRequiresReference(metodo: PaymentMethod): boolean {
  return PAYMENT_METHODS_REQUIRING_REFERENCE.includes(metodo);
}

export function validateSalePayments(payments: SalePaymentInput[], saleTotal: Prisma.Decimal): void {
  if (!payments.length) {
    throw new BadRequestException('Debe registrar al menos un pago');
  }

  for (const payment of payments) {
    if (INVALID_SPLIT_PAYMENT_METHODS.includes(payment.metodo)) {
      throw new BadRequestException(
        'Para pagos mixtos registre una línea por cada medio (efectivo, Yape, etc.)',
      );
    }
    if (paymentRequiresReference(payment.metodo) && !payment.referencia?.trim()) {
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
    throw new BadRequestException('Los pagos no coinciden con el total de la venta');
  }
}
