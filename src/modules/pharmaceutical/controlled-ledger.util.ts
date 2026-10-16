import {
  ControlledLedgerMovementType,
  Prisma,
} from '../../generated/prisma/client';

type Db = Pick<
  Prisma.TransactionClient,
  'product' | 'warehouse' | 'controlledSubstanceLedgerEntry'
>;

/**
 * Libro de control de psicotrópicos y estupefacientes (DIGEMID): cada movimiento de stock de un
 * producto controlado se asienta en la misma transacción, con su saldo por establecimiento.
 * Antes sólo se registraban las ventas (fuera de la transacción) y nunca las entradas, por lo
 * que el saldo del libro quedaba negativo.
 */
export async function recordControlledMovement(
  db: Db,
  movement: {
    productId: string;
    warehouseId: string;
    cantidad: Prisma.Decimal;
    referencia?: string | null;
    comentario?: string | null;
    userId?: string | null;
  },
): Promise<void> {
  // `movement` es la fila creada; sin cantidad (p. ej. dobles de prueba) no hay nada que asentar.
  if (!movement?.cantidad || movement.cantidad.isZero()) return;
  const product = await db.product.findUnique({
    where: { id: movement.productId },
    select: { esControlado: true },
  });
  if (!product?.esControlado) return;
  const warehouse = await db.warehouse.findUnique({
    where: { id: movement.warehouseId },
    select: { establishmentId: true },
  });
  if (!warehouse) return;

  const last = await db.controlledSubstanceLedgerEntry.findFirst({
    where: {
      establishmentId: warehouse.establishmentId,
      productId: movement.productId,
    },
    orderBy: [{ fecha: 'desc' }, { createdAt: 'desc' }],
    select: { saldo: true },
  });
  const entrada = movement.cantidad.greaterThan(0);
  await db.controlledSubstanceLedgerEntry.create({
    data: {
      establishmentId: warehouse.establishmentId,
      productId: movement.productId,
      movementType: entrada
        ? ControlledLedgerMovementType.ENTRADA
        : ControlledLedgerMovementType.SALIDA,
      cantidad: movement.cantidad.abs(),
      saldo: (last?.saldo ?? new Prisma.Decimal(0)).plus(movement.cantidad),
      referencia:
        movement.referencia?.trim() || movement.comentario?.trim() || null,
      userId: movement.userId ?? null,
    },
  });
}
