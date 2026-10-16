import { BadRequestException } from '@nestjs/common';
import { assertLotExpiryConsistent, resolveInboundLot } from './lot-rules.util';

describe('lot-rules', () => {
  const now = new Date('2026-10-16T15:00:00Z');
  const lotes = { nombre: 'Amoxicilina', manejaLotes: true };
  const sinLotes = { nombre: 'Agua', manejaLotes: false };

  it('exige lote y vencimiento cuando el producto maneja lotes', () => {
    expect(() =>
      resolveInboundLot(lotes, undefined, '2027-01-01', now),
    ).toThrow(/indique el código de lote/);
    expect(() => resolveInboundLot(lotes, 'L1', undefined, now)).toThrow(
      /fecha de vencimiento/,
    );
  });

  it('rechaza ingresar mercadería vencida o que vence hoy', () => {
    expect(() => resolveInboundLot(lotes, 'L1', '2026-10-16', now)).toThrow(
      /está vencido/,
    );
  });

  it('rechaza lote en producto sin control de lotes', () => {
    expect(() => resolveInboundLot(sinLotes, 'L1', undefined, now)).toThrow(
      /no maneja lotes/,
    );
    expect(resolveInboundLot(sinLotes, '  ', undefined, now)).toEqual({
      codigoLote: null,
      fechaVencimiento: null,
    });
  });

  it('normaliza el lote válido', () => {
    const r = resolveInboundLot(lotes, ' L1 ', '2027-03-01', now);
    expect(r.codigoLote).toBe('L1');
    expect(r.fechaVencimiento?.toISOString().slice(0, 10)).toBe('2027-03-01');
  });

  it('rechaza un vencimiento distinto para un lote ya registrado', async () => {
    const db = {
      productLotStock: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ fechaVencimiento: new Date('2027-03-01') }),
      },
    };
    await expect(
      assertLotExpiryConsistent(
        db as never,
        'p1',
        'Amoxicilina',
        'L1',
        new Date('2027-04-01'),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      assertLotExpiryConsistent(
        db as never,
        'p1',
        'Amoxicilina',
        'L1',
        new Date('2027-03-01'),
      ),
    ).resolves.toBeUndefined();
  });
});
