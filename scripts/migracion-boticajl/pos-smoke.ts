/**
 * Prueba de humo del POS sobre una copia QA de BoticaJL (vía API HTTP).
 * Uso: npx tsx scripts/migracion-boticajl/pos-smoke.ts <qa-creds.md> [baseUrl]
 */
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';

const creds = readFileSync(process.argv[2], 'utf8');
const B = process.argv[3] ?? 'http://localhost:3000/api/v1';
const cred = (needle: string) => {
  const line = creds.split('\n').find((l) => l.includes(needle))!;
  return { email: /\| ([^|\s]+@[^|\s]+) \|/.exec(line)![1], password: /`([^`]+)`/.exec(line)![1] };
};
let failures = 0;
const check = (cond: boolean, msg: string, extra?: unknown) => {
  console.log(`${cond ? '✓' : '✗'} ${msg}`, extra === undefined ? '' : JSON.stringify(extra).slice(0, 300));
  if (!cond) failures++;
};

async function login(needle: string) {
  const c = cred(needle);
  const r = await fetch(`${B}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(c) });
  const j = (await r.json()) as { accessToken?: string };
  check(!!j.accessToken, `login ${c.email}`);
  const h = { Authorization: `Bearer ${j.accessToken}`, 'Content-Type': 'application/json' };
  const api = async (method: string, path: string, body?: unknown, extra: Record<string, string> = {}) => {
    const res = await fetch(`${B}${path}`, { method, headers: { ...h, ...extra }, body: body ? JSON.stringify(body) : undefined });
    const text = await res.text();
    let json: any = text;
    try { json = JSON.parse(text); } catch { /* texto */ }
    return { status: res.status, body: json };
  };
  return api;
}

async function main() {
  const cashier = await login('esmeralda');
  const admin = await login('admin.boticajl');

  const whs = await cashier('GET', '/inventory-movements/catalogs/warehouses');
  const wh = (whs.body.items ?? whs.body)[0];
  check(!!wh?.id, 'almacén visible para el cajero', wh?.nombre);
  const regs = await cashier('GET', '/cash-registers');
  const reg = (regs.body.items ?? regs.body)[0];
  check(!!reg?.id, 'caja registradora visible', reg?.nombre);
  const active = await cashier('GET', '/cash-registers/sessions/active');
  if (active.body?.id) {
    // Sesión que dejó una corrida anterior de esta prueba en la copia QA.
    const sum = await cashier('GET', `/cash-registers/sessions/${active.body.id}/summary`);
    await cashier('POST', `/cash-registers/sessions/${active.body.id}/close`, { montoCierreFisico: Number(sum.body.saldoActual ?? 0), notasCierre: 'QA limpieza' });
  }

  const open = await cashier('POST', '/cash-registers/sessions/open', { cashRegisterId: reg.id, montoApertura: 20 });
  check(open.status === 201, 'abrir caja con S/ 20', open.status === 201 ? undefined : open.body);
  const sessionId = open.body.id;

  const cat = async (search: string) => (await cashier('GET', `/sales/pos-catalog?warehouseId=${wh.id}&search=${encodeURIComponent(search)}`)).body;
  const pick = (rows: any, name: string) => (rows.items ?? rows).find((p: any) => (p.nombre ?? p.name ?? '').toUpperCase().includes(name));
  const plain = pick(await cat('SUAVE VERDE'), 'SUAVE VERDE');
  check(!!plain, 'buscar producto sin lote en el POS (SUAVE VERDE)', plain && { precio: plain.precioUnitarioVenta ?? plain.precio, stock: plain.stock });
  const lotted = pick(await cat('DIGERMID'), 'DIGERMID');
  check(!!lotted && lotted.manejaLotes, 'buscar producto con lote en el POS (DIGERMID, lote DGN00125)', lotted && { stock: lotted.stock });

  /** stock = vendible (para lotes: stock de lotes no vencidos); lots = stock del almacén. */
  const stockOf = async (name: string) => {
    const row = pick(await cat(name), name);
    return { stock: Number(row?.warehouseStock ?? 0), lots: Number(row?.stock ?? 0) };
  };
  const before = { plain: await stockOf('SUAVE VERDE'), lotted: await stockOf('DIGERMID') };

  const pPlain = Number(plain.precioUnitarioVenta ?? plain.precio);
  const pLot = Number(lotted.precioUnitarioVenta ?? lotted.precio);
  const total = Math.round((pPlain * 2 + pLot) * 100) / 100;
  const sale = await cashier('POST', '/sales', {
    warehouseId: wh.id,
    cashSessionId: sessionId,
    documentType: 'NOTA_VENTA',
    comentario: 'QA prueba de humo migración',
    items: [{ productId: plain.id, quantity: 2 }, { productId: lotted.id, quantity: 1 }],
    payments: [{ metodo: 'EFECTIVO', monto: Math.round((total - pLot) * 100) / 100 }, { metodo: 'YAPE', monto: pLot, referencia: 'QA123' }],
  }, { 'Idempotency-Key': randomUUID() });
  check(sale.status === 201, `venta nota de venta 2 ítems efectivo+Yape S/ ${total}`, sale.status === 201 ? undefined : sale.body);
  const saleId = sale.body.id ?? sale.body.sale?.id;
  const num = `${sale.body.serie ?? sale.body.sale?.serie}-${sale.body.numero ?? sale.body.sale?.numero}`;
  check(/^T001-\d{8}$/.test(num) && Number(num.slice(5)) > 6169, `numeración continúa la de BoticaJL (última T001-00006169): ${num}`);

  const after = { plain: await stockOf('SUAVE VERDE'), lotted: await stockOf('DIGERMID') };
  check(after.plain.stock === before.plain.stock - 2, `stock sin lote ${before.plain.stock} → ${after.plain.stock}`);
  check(after.lotted.stock === before.lotted.stock - 1 && after.lotted.lots === before.lotted.lots - 1, `stock con lote ${before.lotted.stock}/${before.lotted.lots} → ${after.lotted.stock}/${after.lotted.lots}`);

  const expired = pick(await cat('METFORMINA CLORHIDRATO 850'), 'METFORMINA');
  check(!expired, 'producto con único lote vencido (METFORMINA ME24L032) oculto en el POS');

  const voidRes = await admin('POST', `/sales/${saleId}/void`, { reason: 'QA prueba de humo' });
  check(voidRes.status < 300, 'anular la venta (administrador)', voidRes.status < 300 ? undefined : voidRes.body);
  const restored = { plain: await stockOf('SUAVE VERDE'), lotted: await stockOf('DIGERMID') };
  check(restored.plain.stock === before.plain.stock && restored.lotted.stock === before.lotted.stock && restored.lotted.lots === before.lotted.lots, 'la anulación devuelve el stock y el lote');

  const summary = await cashier('GET', `/cash-registers/sessions/${sessionId}/summary`);
  const saldo = Number(summary.body.saldoActual);
  check(saldo === 20, `saldo de caja tras venta+anulación = apertura (S/ ${saldo})`);
  const close = await cashier('POST', `/cash-registers/sessions/${sessionId}/close`, { montoCierreFisico: saldo, notasCierre: 'QA' });
  check(close.status === 201, 'cerrar caja', close.status === 201 ? undefined : close.body);

  for (const [who, api, paths] of [
    ['admin', admin, ['/sales?page=1&pageSize=5', '/products?page=1&pageSize=5', '/suppliers?page=1&pageSize=5', '/customers?page=1&pageSize=5', '/cash-registers/sessions?page=1&pageSize=5']],
    ['cajero', cashier, ['/sales?page=1&pageSize=5', '/customers?page=1&pageSize=5']],
  ] as const) {
    for (const p of paths) {
      const r = await api('GET', p);
      check(r.status === 200, `${who} GET ${p} → ${r.status}`, r.status === 200 ? undefined : r.body?.message);
    }
  }
  console.log(failures ? `\n✗ ${failures} fallos` : '\n✓ POS OK');
  process.exitCode = failures ? 1 : 0;
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
