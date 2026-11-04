import { Prisma } from '../../generated/prisma/client';
import { buildPaymentsByMethod } from './payments-by-method.util';

const d = (v: number | string) => new Prisma.Decimal(v);
const t0 = new Date('2026-11-02T15:00:00Z');
const later = (ms: number) => new Date(t0.getTime() + ms);

describe('buildPaymentsByMethod', () => {
  it('no duplica ventas en efectivo con el movimiento VENTA de caja ni cuenta apertura/cierre', () => {
    const r = buildPaymentsByMethod({
      salePayments: [
        { metodo: 'EFECTIVO', monto: d('50.50') },
        { metodo: 'YAPE', monto: d('20') },
      ],
      saleReturns: [],
      arPayments: [],
      apPayments: [],
      cashMovements: [
        { id: 'a', tipo: 'APERTURA', metodoPago: 'EFECTIVO', monto: d(100), saleId: null, createdAt: t0 },
        { id: 'v', tipo: 'VENTA', metodoPago: 'EFECTIVO', monto: d('50.50'), saleId: 's1', createdAt: t0 },
        { id: 'c', tipo: 'CIERRE', metodoPago: 'EFECTIVO', monto: d('150.50'), saleId: null, createdAt: t0 },
      ],
    });
    expect(r.totalIngresos).toBe('70.50');
    expect(r.totalEgresos).toBe('0.00');
    expect(r.methods.find((m) => m.metodo === 'EFECTIVO')?.ingresos).toBe('50.50');
  });

  it('excluye la línea CREDITO y cuenta el cobro posterior una sola vez (sin su espejo en caja)', () => {
    const r = buildPaymentsByMethod({
      salePayments: [{ metodo: 'CREDITO', monto: d(80) }],
      saleReturns: [],
      arPayments: [{ metodo: 'EFECTIVO', monto: d(30), at: t0 }],
      apPayments: [],
      cashMovements: [
        { id: 'm', tipo: 'INGRESO', metodoPago: 'EFECTIVO', monto: d(30), saleId: null, createdAt: later(200) },
      ],
    });
    expect(r.totalIngresos).toBe('30.00');
    expect(r.methods).toEqual([
      { metodo: 'EFECTIVO', ingresos: '30.00', egresos: '0.00', neto: '30.00', transacciones: 1 },
    ]);
  });

  it('pago a proveedor en efectivo cuenta un egreso; los egresos manuales también', () => {
    const r = buildPaymentsByMethod({
      salePayments: [{ metodo: 'EFECTIVO', monto: d(200) }],
      saleReturns: [],
      arPayments: [],
      apPayments: [{ metodo: 'EFECTIVO', monto: d(40), at: t0 }],
      cashMovements: [
        { id: 'mirror', tipo: 'EGRESO', metodoPago: 'EFECTIVO', monto: d(-40), saleId: null, createdAt: t0 },
        { id: 'gasto', tipo: 'EGRESO', metodoPago: 'EFECTIVO', monto: d(-15), saleId: null, createdAt: later(3_600_000) },
        { id: 'yape-in', tipo: 'INGRESO', metodoPago: 'YAPE', monto: d(10), saleId: null, createdAt: t0 },
      ],
    });
    expect(r.totalIngresos).toBe('210.00');
    expect(r.totalEgresos).toBe('55.00');
    expect(r.neto).toBe('155.00');
  });

  it('devoluciones restan por medio de pago en proporción y no se duplican con la caja', () => {
    const r = buildPaymentsByMethod({
      salePayments: [
        { metodo: 'EFECTIVO', monto: d(60) },
        { metodo: 'YAPE', monto: d(40) },
      ],
      saleReturns: [
        {
          totalDevuelto: d(50),
          saleTotal: d(100),
          payments: [
            { metodo: 'EFECTIVO', monto: d(60) },
            { metodo: 'YAPE', monto: d(40) },
          ],
        },
      ],
      arPayments: [],
      apPayments: [],
      cashMovements: [
        { id: 'dev', tipo: 'EGRESO', metodoPago: 'EFECTIVO', monto: d(-30), saleId: 's1', createdAt: t0 },
      ],
    });
    const ef = r.methods.find((m) => m.metodo === 'EFECTIVO');
    const ya = r.methods.find((m) => m.metodo === 'YAPE');
    expect(ef?.egresos).toBe('30.00');
    expect(ya?.egresos).toBe('20.00');
    expect(r.totalEgresos).toBe('50.00');
    expect(r.neto).toBe('50.00');
  });

  it('los totales siempre cuadran con la suma de filas redondeadas', () => {
    const r = buildPaymentsByMethod({
      salePayments: [
        { metodo: 'EFECTIVO', monto: d('0.3333') },
        { metodo: 'EFECTIVO', monto: d('0.3333') },
        { metodo: 'YAPE', monto: d('0.3334') },
      ],
      saleReturns: [],
      arPayments: [],
      apPayments: [],
      cashMovements: [],
    });
    const sum = r.methods.reduce((a, m) => a.plus(m.ingresos), d(0));
    expect(sum.toFixed(2)).toBe(r.totalIngresos);
  });
});
