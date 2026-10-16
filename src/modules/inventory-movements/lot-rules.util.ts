import { BadRequestException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';

type LotDb = Pick<Prisma.TransactionClient, 'productLotStock'>;

/** dd/mm/aaaa en UTC: los vencimientos se guardan como fecha (medianoche UTC). */
function formatDate(date: Date): string {
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${date.getUTCFullYear()}`;
}

function sameDay(a: Date, b: Date): boolean {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

/**
 * Reglas de ingreso de un lote (compras, ingresos manuales): un producto que maneja lotes
 * exige código de lote y fecha de vencimiento (DIGEMID), no se ingresa mercadería vencida y
 * un producto sin control de lotes no acepta lote (su stock no se descontaría por lote).
 */
export function resolveInboundLot(
  product: { nombre: string; manejaLotes: boolean },
  lotCode: string | null | undefined,
  expirationDate: string | null | undefined,
  now: Date = new Date(),
): { codigoLote: string | null; fechaVencimiento: Date | null } {
  const codigoLote = lotCode?.trim() || null;
  const fechaVencimiento = expirationDate ? new Date(expirationDate) : null;
  if (fechaVencimiento && Number.isNaN(fechaVencimiento.getTime())) {
    throw new BadRequestException(
      `Fecha de vencimiento inválida para ${product.nombre}`,
    );
  }
  if (!product.manejaLotes) {
    if (codigoLote) {
      throw new BadRequestException(
        `El producto ${product.nombre} no maneja lotes: quite el lote o active "Maneja lotes" en el producto`,
      );
    }
    return { codigoLote: null, fechaVencimiento: null };
  }
  if (!codigoLote) {
    throw new BadRequestException(
      `El producto ${product.nombre} maneja lotes: indique el código de lote`,
    );
  }
  if (!fechaVencimiento) {
    throw new BadRequestException(
      `El producto ${product.nombre} maneja lotes: indique la fecha de vencimiento del lote ${codigoLote}`,
    );
  }
  const today = now.toISOString().slice(0, 10);
  if (fechaVencimiento.toISOString().slice(0, 10) <= today) {
    throw new BadRequestException(
      `El lote ${codigoLote} de ${product.nombre} está vencido (${formatDate(fechaVencimiento)}): no se puede ingresar mercadería vencida`,
    );
  }
  return { codigoLote, fechaVencimiento };
}

/**
 * Un mismo lote del fabricante tiene un único vencimiento: si el lote ya existe (en cualquier
 * almacén) con otra fecha, se rechaza en vez de sobrescribirla en silencio.
 */
export async function assertLotExpiryConsistent(
  db: LotDb,
  productId: string,
  productName: string,
  codigoLote: string | null,
  fechaVencimiento: Date | null,
): Promise<void> {
  if (!codigoLote || !fechaVencimiento) return;
  const existing = await db.productLotStock.findFirst({
    where: {
      productId,
      codigoLote,
      deletedAt: null,
      fechaVencimiento: { not: null },
    },
    select: { fechaVencimiento: true },
  });
  if (
    existing?.fechaVencimiento &&
    !sameDay(existing.fechaVencimiento, fechaVencimiento)
  ) {
    throw new BadRequestException(
      `El lote ${codigoLote} de ${productName} ya está registrado con vencimiento ${formatDate(existing.fechaVencimiento)}; verifique la fecha ingresada (${formatDate(fechaVencimiento)})`,
    );
  }
}
