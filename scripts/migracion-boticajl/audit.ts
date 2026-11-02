/**
 * Auditoría de solo lectura del cliente BOTICAJL migrado.
 * Uso: npx tsx scripts/migracion-boticajl/audit.ts <data.json>
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});
const src = JSON.parse(readFileSync(process.argv[2], 'utf8')) as Record<string, Record<string, string | null>[]>;
const t = (v: string | null | undefined) => (v ?? '').trim();
const D = (v: unknown) => new Prisma.Decimal((v as Prisma.Decimal | string | number | null) ?? 0);
const issues: string[] = [];
const ok = (cond: boolean, msg: string) => {
  console.log(`${cond ? '✓' : '✗'} ${msg}`);
  if (!cond) issues.push(msg);
};

async function main() {
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug: 'boticajl' } });
  const est = await prisma.establishment.findFirstOrThrow({ where: { tenantId: tenant.id } });
  const wh = await prisma.warehouse.findFirstOrThrow({ where: { establishmentId: est.id } });
  console.log(`Tenant ${tenant.nombre} ${tenant.status} plan=${tenant.plan} módulos=${(tenant.enabledModules as string[]).length}`);

  // Usuarios
  const users = await prisma.user.findMany({
    where: { tenantId: tenant.id },
    include: { _count: { select: { permissions: true } } },
  });
  for (const u of users) ok(u._count.permissions > 0 && u.establecimientoId === est.id, `usuario ${u.email} ${u.role} permisos=${u._count.permissions}`);

  // Productos y stock
  const products = await prisma.product.findMany({
    where: { tenantId: tenant.id },
    include: { warehouseStocks: true, lotStocks: { where: { deletedAt: null } } },
  });
  ok(products.length === src.productos.length, `productos ${products.length}/${src.productos.length}`);
  const srcByName = new Map<string, Record<string, string | null>[]>();
  for (const p of src.productos) srcByName.set(t(p.descripcion), [...(srcByName.get(t(p.descripcion)) ?? []), p]);
  let priceMismatch = 0, stockMismatch = 0, lotMismatch = 0, noWh = 0, zeroPrice = 0;
  const expiredWithStock: string[] = [];
  const now = new Date();
  for (const p of products) {
    const ws = p.warehouseStocks.find((w) => w.warehouseId === wh.id);
    if (!ws) noWh++;
    const lotSum = p.lotStocks.reduce((a, l) => a.add(l.stock), new Prisma.Decimal(0));
    if (p.manejaLotes && ws && !lotSum.equals(ws.cantidad)) lotMismatch++;
    if (D(p.precioUnitarioVenta).lte(0)) zeroPrice++;
    const cands = srcByName.get(p.nombre) ?? [];
    const match = cands.find((c) => D(c.precio_venta).equals(p.precioUnitarioVenta) && ws && D(c.stock).equals(ws.cantidad));
    if (!match) {
      if (!cands.some((c) => D(c.precio_venta).equals(p.precioUnitarioVenta))) priceMismatch++;
      else stockMismatch++;
    }
    for (const l of p.lotStocks) if (l.fechaVencimiento && l.fechaVencimiento < now && l.stock.gt(0)) expiredWithStock.push(`${p.nombre} lote ${l.codigoLote} vence ${l.fechaVencimiento.toISOString().slice(0, 10)} stock ${l.stock}`);
  }
  ok(noWh === 0, `productos sin fila de stock en almacén: ${noWh}`);
  ok(priceMismatch === 0, `productos con precio distinto al origen: ${priceMismatch}`);
  ok(stockMismatch === 0, `productos con stock distinto al origen: ${stockMismatch}`);
  ok(lotMismatch === 0, `productos con lotes cuyo stock no suma el del almacén: ${lotMismatch}`);
  ok(zeroPrice === 0, `productos con precio de venta 0: ${zeroPrice}`);
  console.log(`  lotes vencidos con stock (bloqueados en POS): ${expiredWithStock.length}`);
  for (const e of expiredWithStock) console.log(`   - ${e}`);
  const inbound = await prisma.inventoryInboundMovement.aggregate({ where: { warehouseId: wh.id }, _sum: { cantidad: true }, _count: true });
  const whSum = products.reduce((a, p) => a.add(p.warehouseStocks[0]?.cantidad ?? 0), new Prisma.Decimal(0));
  ok(D(inbound._sum.cantidad).equals(whSum), `kardex inicial ${inbound._sum.cantidad} = stock ${whSum}`);

  // Ventas
  const sales = await prisma.sale.findMany({
    where: { establishmentId: est.id },
    include: { items: true, payments: true },
  });
  ok(sales.length === src.venta.length, `ventas ${sales.length}/${src.venta.length}`);
  let itemsBad = 0, paysBad = 0, noItems = 0;
  for (const s of sales) {
    if (!s.items.length) noItems++;
    const it = s.items.reduce((a, i) => a.add(i.totalLinea), new Prisma.Decimal(0));
    if (it.minus(s.total).abs().gt(0.05)) itemsBad++;
    const pa = s.payments.reduce((a, p) => a.add(p.monto), new Prisma.Decimal(0));
    if (pa.minus(s.total).abs().gt(0.05)) paysBad++;
  }
  ok(noItems === 0, `ventas sin detalle: ${noItems}`);
  ok(itemsBad === 0, `ventas cuyo detalle no suma el total (±0.05): ${itemsBad}`);
  ok(paysBad === 0, `ventas cuyos pagos no suman el total (±0.05): ${paysBad}`);
  const srcItemsBad = src.venta.filter((v) => {
    const sum = src.detalleventa.filter((i) => i.idventa === v.idventa).reduce((a, i) => a.add(D(t(i.importe_total))), new Prisma.Decimal(0));
    return sum.minus(D(t(v.total))).abs().gt(0.05);
  }).length;
  console.log(`  (en BoticaJL ya había ${srcItemsBad} ventas cuyo detalle no suma el total)`);
  const anuladas = sales.filter((s) => s.estado === 'ANULADA').length;
  ok(anuladas === src.venta.filter((v) => t(v.estado) === 'anulado').length, `anuladas ${anuladas}`);
  const last = await prisma.sale.findFirst({ where: { establishmentId: est.id, documentType: 'NOTA_VENTA', serie: 'T001' }, orderBy: { numero: 'desc' } });
  console.log(`  siguiente número de venta: T001-${String(Number(last?.numero) + 1).padStart(8, '0')}`);
  const nums = new Map<string, number>();
  for (const s of sales) nums.set(`${s.serie}-${s.numero}`, (nums.get(`${s.serie}-${s.numero}`) ?? 0) + 1);
  const dup = [...nums.values()].filter((n) => n > 1).length;
  ok(dup === 0, `números de venta duplicados: ${dup}`);
  const byDay = new Map<string, Prisma.Decimal>();
  for (const s of sales.filter((s) => s.estado !== 'ANULADA')) {
    const k = new Date(s.createdAt.getTime() - 5 * 3600e3).toISOString().slice(0, 10);
    byDay.set(k, (byDay.get(k) ?? new Prisma.Decimal(0)).add(s.total));
  }
  const srcDay = new Map<string, Prisma.Decimal>();
  for (const v of src.venta.filter((v) => t(v.estado) !== 'anulado')) {
    const k = t(v.fecha_emision).slice(0, 10);
    srcDay.set(k, (srcDay.get(k) ?? new Prisma.Decimal(0)).add(D(t(v.total))));
  }
  const dayDiff = [...srcDay].filter(([k, v]) => !v.equals(byDay.get(k) ?? 0));
  ok(dayDiff.length === 0, `ventas por día (zona Lima) iguales al origen; días distintos: ${dayDiff.length}`);

  // Caja
  const sessions = await prisma.cashSession.findMany({ where: { cashRegister: { establishmentId: est.id } } });
  ok(sessions.every((s) => s.estado === 'CERRADA'), `sesiones de caja ${sessions.length}, abiertas: ${sessions.filter((s) => s.estado !== 'CERRADA').length}`);
  ok(sessions.every((s) => !s.closedAt || s.closedAt >= s.openedAt), `sesiones con cierre antes de apertura: ${sessions.filter((s) => s.closedAt && s.closedAt < s.openedAt).length}`);
  const regs = await prisma.cashRegister.count({ where: { establishmentId: est.id, activo: true } });
  ok(regs === 1, `cajas registradoras activas: ${regs}`);

  // Proveedores / clientes / series
  const sup = await prisma.supplier.count({ where: { tenantId: tenant.id } });
  const cus = await prisma.customer.count({ where: { tenantId: tenant.id } });
  const ser = await prisma.establishmentSeries.findMany({ where: { establishmentId: est.id } });
  console.log(`  proveedores=${sup} clientes=${cus} series=${ser.map((s) => `${s.documentType}:${s.numero}`).join(',')}`);
  console.log(`  establecimiento: dirección=${est.direccionFiscal ?? '—'} ubigeo=${est.districtId} yape=${est.posYapeNumero ?? '—'} bloquearVencidos=${est.blockExpiredProductSales}`);
  const billing = await prisma.establishmentBillingConfig.findUnique({ where: { establishmentId: est.id } });
  console.log(`  facturación electrónica: ${billing ? 'configurada' : 'NO configurada (solo notas de venta)'}`);

  console.log(issues.length ? `\n✗ ${issues.length} observaciones` : '\n✓ Sin observaciones');
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
