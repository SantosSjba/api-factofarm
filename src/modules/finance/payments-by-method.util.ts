import { Prisma } from '../../generated/prisma/client';

/**
 * Reporte "Ingresos y egresos por medio de pago": dinero que realmente entró o salió,
 * agrupado por medio. Cada operación se cuenta una sola vez:
 *
 * - Ventas (no anuladas): sus pagos, salvo la línea CREDITO (no es dinero recibido;
 *   se cuenta cuando se cobra la cuenta por cobrar).
 * - Devoluciones: egreso repartido entre los medios con que se pagó la venta, en la misma
 *   proporción que usa la devolución de efectivo en caja.
 * - Cobros de cuentas por cobrar (ingreso) y pagos a proveedores (egreso).
 * - Caja: solo ingresos/egresos manuales. Se excluyen APERTURA y CIERRE (son saldos, no
 *   flujo), VENTA/ANULACION y los movimientos ligados a una venta (ya contados por la
 *   venta o la devolución) y el espejo en caja de cada cobro/pago en efectivo.
 */

type Decimal = Prisma.Decimal;

export type SalePaymentRow = { metodo: string; monto: Decimal };
export type SaleReturnRow = {
  totalDevuelto: Decimal;
  saleTotal: Decimal;
  payments: SalePaymentRow[];
};
export type DebtPaymentRow = {
  metodo: string | null;
  monto: Decimal;
  at: Date;
};
export type CashMovementRow = {
  id: string;
  tipo: string;
  metodoPago: string | null;
  monto: Decimal;
  saleId: string | null;
  createdAt: Date;
};

export type PaymentsByMethodInput = {
  salePayments: SalePaymentRow[];
  saleReturns: SaleReturnRow[];
  arPayments: DebtPaymentRow[];
  apPayments: DebtPaymentRow[];
  cashMovements: CashMovementRow[];
};

export type PaymentsByMethodRow = {
  metodo: string;
  ingresos: string;
  egresos: string;
  neto: string;
  transacciones: number;
};

const ZERO = () => new Prisma.Decimal(0);
const EFECTIVO = 'EFECTIVO';
const CREDITO = 'CREDITO';
/** Margen para emparejar un cobro/pago con su movimiento de caja (misma transacción). */
const MIRROR_WINDOW_MS = 2 * 60 * 1000;

function methodKey(metodo: string | null | undefined): string {
  return metodo?.trim().toUpperCase() || 'SIN_ESPECIFICAR';
}

export function buildPaymentsByMethod(input: PaymentsByMethodInput) {
  const byMethod = new Map<
    string,
    { ingresos: Decimal; egresos: Decimal; count: number }
  >();
  const add = (metodo: string | null | undefined, ingreso: Decimal, egreso: Decimal) => {
    const key = methodKey(metodo);
    const prev = byMethod.get(key) ?? { ingresos: ZERO(), egresos: ZERO(), count: 0 };
    prev.ingresos = prev.ingresos.plus(ingreso);
    prev.egresos = prev.egresos.plus(egreso);
    prev.count += 1;
    byMethod.set(key, prev);
  };

  for (const p of input.salePayments) {
    if (methodKey(p.metodo) === CREDITO || p.monto.isZero()) continue;
    add(p.metodo, p.monto, ZERO());
  }

  for (const r of input.saleReturns) {
    if (!r.saleTotal.greaterThan(0) || !r.totalDevuelto.greaterThan(0)) continue;
    for (const p of r.payments) {
      if (methodKey(p.metodo) === CREDITO || !p.monto.greaterThan(0)) continue;
      add(p.metodo, ZERO(), p.monto.times(r.totalDevuelto).div(r.saleTotal));
    }
  }

  // Movimientos manuales de caja candidatos (los espejos de cobros/pagos se descartan abajo).
  const manual = input.cashMovements.filter(
    (m) => (m.tipo === 'INGRESO' || m.tipo === 'EGRESO') && !m.saleId && !m.monto.isZero(),
  );
  const consumed = new Set<string>();
  const consumeMirror = (p: DebtPaymentRow, sign: 1 | -1) => {
    if (methodKey(p.metodo) !== EFECTIVO) return;
    const target = sign === 1 ? p.monto : p.monto.negated();
    const mirror = manual.find(
      (m) =>
        !consumed.has(m.id) &&
        methodKey(m.metodoPago ?? EFECTIVO) === EFECTIVO &&
        m.monto.equals(target) &&
        Math.abs(m.createdAt.getTime() - p.at.getTime()) <= MIRROR_WINDOW_MS,
    );
    if (mirror) consumed.add(mirror.id);
  };

  for (const p of input.arPayments) {
    add(p.metodo, p.monto, ZERO());
    consumeMirror(p, 1);
  }
  for (const p of input.apPayments) {
    add(p.metodo, ZERO(), p.monto);
    consumeMirror(p, -1);
  }

  for (const m of manual) {
    if (consumed.has(m.id)) continue;
    const metodo = m.metodoPago ?? EFECTIVO;
    if (m.monto.greaterThan(0)) add(metodo, m.monto, ZERO());
    else add(metodo, ZERO(), m.monto.abs());
  }

  const round = (d: Decimal) => d.toDecimalPlaces(2);
  const methods: PaymentsByMethodRow[] = [...byMethod.entries()]
    .map(([metodo, b]) => ({
      metodo,
      ingresos: round(b.ingresos).toFixed(2),
      egresos: round(b.egresos).toFixed(2),
      neto: round(b.ingresos).minus(round(b.egresos)).toFixed(2),
      transacciones: b.count,
    }))
    .sort((a, b) => Number.parseFloat(b.ingresos) - Number.parseFloat(a.ingresos));

  // Totales = suma de las filas mostradas (ya redondeadas), para que siempre cuadren.
  const totalIngresos = methods.reduce((acc, r) => acc.plus(r.ingresos), ZERO());
  const totalEgresos = methods.reduce((acc, r) => acc.plus(r.egresos), ZERO());

  return {
    totalIngresos: totalIngresos.toFixed(2),
    totalEgresos: totalEgresos.toFixed(2),
    neto: totalIngresos.minus(totalEgresos).toFixed(2),
    methods,
  };
}
