import {
  ControlledLedgerMovementType,
  Prisma,
} from '../../generated/prisma/client';
import { recordControlledMovement } from './controlled-ledger.util';

function db(esControlado: boolean, lastSaldo: number | null) {
  return {
    product: { findUnique: jest.fn().mockResolvedValue({ esControlado }) },
    warehouse: {
      findUnique: jest.fn().mockResolvedValue({ establishmentId: 'est-1' }),
    },
    controlledSubstanceLedgerEntry: {
      findFirst: jest
        .fn()
        .mockResolvedValue(
          lastSaldo === null ? null : { saldo: new Prisma.Decimal(lastSaldo) },
        ),
      create: jest.fn().mockResolvedValue({}),
    },
  };
}

const move = (cantidad: number) => ({
  productId: 'p1',
  warehouseId: 'w1',
  cantidad: new Prisma.Decimal(cantidad),
  referencia: 'F001-1',
});

type Entry = {
  data: {
    movementType: ControlledLedgerMovementType;
    cantidad: Prisma.Decimal;
    saldo: Prisma.Decimal;
    establishmentId: string;
  };
};
const createdEntry = (d: ReturnType<typeof db>) =>
  (d.controlledSubstanceLedgerEntry.create.mock.calls[0] as [Entry])[0].data;

describe('recordControlledMovement', () => {
  it('ignora productos no controlados', async () => {
    const d = db(false, 0);
    await recordControlledMovement(d as never, move(5));
    expect(d.controlledSubstanceLedgerEntry.create).not.toHaveBeenCalled();
  });

  it('asienta entradas sumando al saldo', async () => {
    const d = db(true, 10);
    await recordControlledMovement(d as never, move(5));
    const data = createdEntry(d);
    expect(data.movementType).toBe(ControlledLedgerMovementType.ENTRADA);
    expect(data.saldo.toString()).toBe('15');
    expect(data.establishmentId).toBe('est-1');
  });

  it('asienta salidas con cantidad positiva y saldo descontado', async () => {
    const d = db(true, 10);
    await recordControlledMovement(d as never, move(-3));
    const data = createdEntry(d);
    expect(data.movementType).toBe(ControlledLedgerMovementType.SALIDA);
    expect(data.cantidad.toString()).toBe('3');
    expect(data.saldo.toString()).toBe('7');
  });
});
