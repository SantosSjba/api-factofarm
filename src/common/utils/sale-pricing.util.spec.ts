import { DiscountType, Prisma } from '../../generated/prisma/client';
import {
  applySaleLevelDiscount,
  computeSaleLineTotals,
  isTaxGravado,
} from './sale-pricing.util';

describe('sale-pricing.util', () => {
  it('identifica líneas gravadas', () => {
    expect(isTaxGravado('10')).toBe(true);
    expect(isTaxGravado('30')).toBe(false);
  });

  it('calcula IGV incluido en precio', () => {
    const result = computeSaleLineTotals({
      unitPrice: new Prisma.Decimal(10),
      quantity: new Prisma.Decimal(1),
      incluyeIgv: true,
      taxCodigo: '10',
    });
    expect(result.totalLinea.toString()).toBe('10');
    expect(result.igvLinea.toNumber()).toBeCloseTo(1.53, 2);
  });

  it('calcula IGV excluido en precio', () => {
    const result = computeSaleLineTotals({
      unitPrice: new Prisma.Decimal(10),
      quantity: new Prisma.Decimal(2),
      incluyeIgv: false,
      taxCodigo: '10',
    });
    expect(result.totalLinea.toString()).toBe('23.6');
  });

  it('aplica descuento por línea en porcentaje', () => {
    const result = computeSaleLineTotals({
      unitPrice: new Prisma.Decimal(100),
      quantity: new Prisma.Decimal(1),
      incluyeIgv: false,
      taxCodigo: '10',
      discountType: DiscountType.PORCENTAJE,
      discountValue: new Prisma.Decimal(10),
    });
    expect(result.subtotalLinea.toString()).toBe('90');
  });

  it('no aplica IGV en línea inafecta', () => {
    const result = computeSaleLineTotals({
      unitPrice: new Prisma.Decimal(15),
      quantity: new Prisma.Decimal(1),
      incluyeIgv: false,
      taxCodigo: '30',
    });
    expect(result.igvLinea.toString()).toBe('0');
    expect(result.totalLinea.toString()).toBe('15');
  });

  it('aplica descuento a nivel venta', () => {
    const result = applySaleLevelDiscount(
      new Prisma.Decimal(84.75),
      new Prisma.Decimal(15.25),
      new Prisma.Decimal(100),
      DiscountType.MONTO_FIJO,
      new Prisma.Decimal(10),
    );
    expect(result.total.toString()).toBe('90');
    expect(result.descuento.toString()).toBe('10');
  });
});
