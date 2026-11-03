import { BadRequestException } from '@nestjs/common';
import { PaymentMethod, Prisma } from '../../../generated/prisma/client';
import { validateSalePayments } from './payment-validation.util';

describe('validateSalePayments', () => {
  it('acepta pago mixto efectivo + yape con referencias', () => {
    expect(() =>
      validateSalePayments(
        [
          { metodo: PaymentMethod.EFECTIVO, monto: 30 },
          { metodo: PaymentMethod.YAPE, monto: 70, referencia: 'OP-123456' },
        ],
        new Prisma.Decimal(100),
      ),
    ).not.toThrow();
  });

  it('rechaza yape sin código de operación', () => {
    expect(() =>
      validateSalePayments(
        [{ metodo: PaymentMethod.YAPE, monto: 50 }],
        new Prisma.Decimal(50),
      ),
    ).toThrow(BadRequestException);
  });

  it('acepta yape sin código si el local lo configuró como opcional', () => {
    expect(() =>
      validateSalePayments(
        [{ metodo: PaymentMethod.YAPE, monto: 50 }],
        new Prisma.Decimal(50),
        [PaymentMethod.TARJETA],
      ),
    ).not.toThrow();
  });

  it('sigue exigiendo código en los medios que el local mantiene obligatorios', () => {
    expect(() =>
      validateSalePayments(
        [{ metodo: PaymentMethod.TARJETA, monto: 50 }],
        new Prisma.Decimal(50),
        [PaymentMethod.TARJETA],
      ),
    ).toThrow(BadRequestException);
  });

  it('rechaza método MIXTO en línea de pago', () => {
    expect(() =>
      validateSalePayments(
        [{ metodo: PaymentMethod.MIXTO, monto: 50, referencia: 'X' }],
        new Prisma.Decimal(50),
      ),
    ).toThrow(BadRequestException);
  });

  it('rechaza cuando la suma no coincide con el total', () => {
    expect(() =>
      validateSalePayments(
        [
          { metodo: PaymentMethod.EFECTIVO, monto: 20 },
          { metodo: PaymentMethod.PLIN, monto: 30, referencia: 'PLIN-1' },
        ],
        new Prisma.Decimal(100),
      ),
    ).toThrow(BadRequestException);
  });
});
