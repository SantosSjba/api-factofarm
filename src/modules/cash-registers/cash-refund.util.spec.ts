import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { resolveRefundCashSession } from './cash-refund.util';

function makeDb(opts: { originalOpen: boolean; mine: string | null; cash: number }) {
  return {
    cashSession: {
      findFirst: jest.fn(({ where }: { where: { id?: string } }) => {
        if (where.id) return Promise.resolve(opts.originalOpen ? { id: where.id } : null);
        return Promise.resolve(opts.mine ? { id: opts.mine } : null);
      }),
    },
    cashMovement: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { monto: new Prisma.Decimal(opts.cash) } }),
    },
  } as never;
}

const input = (amount: number) => ({
  saleCashSessionId: 'orig',
  userId: 'u1',
  establishmentId: 'e1',
  amount: new Prisma.Decimal(amount),
});

describe('resolveRefundCashSession', () => {
  it('usa la caja de la venta si sigue abierta', async () => {
    const res = await resolveRefundCashSession(makeDb({ originalOpen: true, mine: 'mia', cash: 50 }), input(10));
    expect(res).toEqual({ cashSessionId: 'orig', fromOtherSession: false });
  });

  it('si la caja de la venta cerró, usa la caja abierta de quien anula', async () => {
    const res = await resolveRefundCashSession(makeDb({ originalOpen: false, mine: 'mia', cash: 50 }), input(10));
    expect(res).toEqual({ cashSessionId: 'mia', fromOtherSession: true });
  });

  it('pide abrir caja si quien anula no tiene una abierta', async () => {
    await expect(
      resolveRefundCashSession(makeDb({ originalOpen: false, mine: null, cash: 0 }), input(10)),
    ).rejects.toThrow('Abre tu caja');
  });

  it('no deja devolver más efectivo del que hay', async () => {
    await expect(
      resolveRefundCashSession(makeDb({ originalOpen: false, mine: 'mia', cash: 5 }), input(10)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
