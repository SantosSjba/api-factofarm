import { DiscountType, Prisma } from '../../generated/prisma/client';

export const IGV_RATE = new Prisma.Decimal('0.18');

export function isTaxGravado(taxCodigo: string) {
  return taxCodigo.startsWith('10') || /^1[1-6]$/.test(taxCodigo);
}

export type SaleLinePricingInput = {
  unitPrice: Prisma.Decimal;
  quantity: Prisma.Decimal;
  incluyeIgv: boolean;
  taxCodigo: string;
  discountType?: DiscountType | null;
  discountValue?: Prisma.Decimal | null;
};

export type SaleLinePricingResult = {
  subtotalLinea: Prisma.Decimal;
  igvLinea: Prisma.Decimal;
  totalLinea: Prisma.Decimal;
};

export function computeSaleLineTotals(input: SaleLinePricingInput): SaleLinePricingResult {
  const gravado = isTaxGravado(input.taxCodigo);
  const qty = input.quantity;
  let lineGross = input.unitPrice.times(qty);

  if (input.discountType && input.discountValue && !input.discountValue.isZero()) {
    const discount =
      input.discountType === DiscountType.PORCENTAJE
        ? lineGross.times(input.discountValue).div(100)
        : input.discountValue;
    lineGross = Prisma.Decimal.max(lineGross.minus(discount), new Prisma.Decimal(0));
  }

  if (!gravado) {
    return {
      subtotalLinea: lineGross,
      igvLinea: new Prisma.Decimal(0),
      totalLinea: lineGross,
    };
  }

  if (input.incluyeIgv) {
    const subtotal = lineGross.div(new Prisma.Decimal(1).plus(IGV_RATE));
    const igv = lineGross.minus(subtotal);
    return {
      subtotalLinea: subtotal,
      igvLinea: igv,
      totalLinea: lineGross,
    };
  }

  const igv = lineGross.times(IGV_RATE);
  return {
    subtotalLinea: lineGross,
    igvLinea: igv,
    totalLinea: lineGross.plus(igv),
  };
}

export function applySaleLevelDiscount(
  subtotal: Prisma.Decimal,
  igv: Prisma.Decimal,
  total: Prisma.Decimal,
  discountType?: DiscountType | null,
  discountValue?: Prisma.Decimal | null,
) {
  if (!discountType || !discountValue || discountValue.isZero()) {
    return { subtotal, igv, total, descuento: new Prisma.Decimal(0) };
  }
  const discount =
    discountType === DiscountType.PORCENTAJE
      ? total.times(discountValue).div(100)
      : discountValue;
  const newTotal = Prisma.Decimal.max(total.minus(discount), new Prisma.Decimal(0));
  const ratio = total.isZero() ? new Prisma.Decimal(0) : newTotal.div(total);
  return {
    subtotal: subtotal.times(ratio),
    igv: igv.times(ratio),
    total: newTotal,
    descuento: discount,
  };
}

export function explodePackSaleItems(
  packQty: Prisma.Decimal,
  packUnitPrice: Prisma.Decimal,
  items: Array<{ productId: string; cantidad: Prisma.Decimal; precioUnitario: Prisma.Decimal; total: Prisma.Decimal }>,
): Array<{ productId: string; quantity: Prisma.Decimal; unitPrice: Prisma.Decimal }> {
  if (!items.length) return [];
  const packTotal = packUnitPrice.times(packQty);
  const weights = items.map((it) => {
    const weight = it.total.gt(0) ? it.total : it.precioUnitario.times(it.cantidad);
    return weight.gt(0) ? weight : new Prisma.Decimal(1);
  });
  const weightSum = weights.reduce((acc, w) => acc.plus(w), new Prisma.Decimal(0));
  return items.map((it, idx) => {
    const componentQty = it.cantidad.times(packQty);
    const share = packTotal.times(weights[idx]!).div(weightSum);
    const unitPrice = componentQty.gt(0) ? share.div(componentQty) : new Prisma.Decimal(0);
    return { productId: it.productId, quantity: componentQty, unitPrice };
  });
}
