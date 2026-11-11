import { BadRequestException } from '@nestjs/common';
import {
  InventoryMovementType,
  Prisma,
} from '../../generated/prisma/client';
import { recordControlledMovement } from '../pharmaceutical/controlled-ledger.util';

/** Motivo de kardex del stock que entra sin compra ni ingreso (alta de producto, importaciones). */
export const OPENING_BALANCE_REASON_CODE = 'INVENTARIO_INICIAL';

type Db = Pick<
  Prisma.TransactionClient,
  | 'inventoryTransferReason'
  | 'inventoryInboundMovement'
  | 'product'
  | 'warehouse'
  | 'controlledSubstanceLedgerEntry'
>;

/**
 * Deja en el kardex la entrada de un stock que se creó directamente (stock inicial al crear un
 * producto, importación de productos, lotes o series). Sin este movimiento el kardex no cuadra
 * con el stock: arranca en cero y las ventas lo dejan en negativo.
 */
export async function recordOpeningBalance(
  db: Db,
  input: {
    productId: string;
    warehouseId: string;
    cantidad: Prisma.Decimal | number;
    codigoLote?: string | null;
    fechaVencimiento?: Date | null;
    costoUnitario?: Prisma.Decimal | number | null;
    comentario: string;
    userId?: string | null;
  },
): Promise<void> {
  const cantidad = new Prisma.Decimal(input.cantidad);
  if (!cantidad.greaterThan(0)) return;

  const reason = await db.inventoryTransferReason.findFirst({
    where: { codigo: OPENING_BALANCE_REASON_CODE, deletedAt: null },
    select: { id: true },
  });
  if (!reason) {
    throw new BadRequestException(
      `Falta el motivo de inventario «Inventario inicial» (${OPENING_BALANCE_REASON_CODE}). Pide al administrador de la plataforma que lo configure.`,
    );
  }

  const movement = await db.inventoryInboundMovement.create({
    data: {
      productId: input.productId,
      warehouseId: input.warehouseId,
      transferReasonId: reason.id,
      movementType: InventoryMovementType.INGRESO,
      cantidad,
      codigoLote: input.codigoLote || null,
      fechaVencimiento: input.fechaVencimiento ?? null,
      costoUnitario:
        input.costoUnitario != null
          ? new Prisma.Decimal(input.costoUnitario)
          : null,
      comentario: input.comentario,
      userId: input.userId ?? null,
    },
  });
  await recordControlledMovement(db, movement);
}
