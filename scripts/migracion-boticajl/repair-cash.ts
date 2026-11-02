/**
 * Corrige las sesiones de caja de BOTICAJL ya migradas: re-empareja cierres, revincula ventas
 * (y sus movimientos VENTA/ANULACION) a la sesión cuyo intervalo las contiene.
 *
 * Uso: npx tsx scripts/migracion-boticajl/repair-cash.ts <data.json> [--apply]
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import { CashMovementType, Prisma, PrismaClient } from '../../src/generated/prisma/client';
import { clean, matchCashSessions, pickSessionIndex } from './cash-matching';

const APPLY = process.argv.includes('--apply');
const d = JSON.parse(readFileSync(process.argv[2], 'utf8')) as Record<string, Record<string, string | null>[]>;
const dec = (v: string | null | undefined) => new Prisma.Decimal(clean(v) || '0');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
class DryRunRollback extends Error {}

async function main() {
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug: 'boticajl' } });
  const est = await prisma.establishment.findFirstOrThrow({ where: { tenantId: tenant.id } });
  const users = await prisma.user.findMany({ where: { tenantId: tenant.id } });
  const loginToEmail: Record<string, string> = {
    admin: 'admin.boticajl@factofarm.com',
    leidy2025: 'leidy.boticajl@factofarm.com',
    esmeraldac: 'esmeralda.boticajl@factofarm.com',
  };
  const userIdByLogin = new Map(Object.entries(loginToEmail).map(([k, e]) => [k, users.find((u) => u.email === e)!.id]));
  const adminId = userIdByLogin.get('admin')!;

  const dbSessions = await prisma.cashSession.findMany({ where: { cashRegister: { establishmentId: est.id } } });
  const now = new Date();
  const matched = matchCashSessions(d.caja_apertura, d.caja_cierre, now);
  const pool = [...dbSessions];
  const sessions = matched.map((m) => {
    const userId = userIdByLogin.get(m.user) ?? adminId;
    const i = pool.findIndex((s) => s.userId === userId && s.openedAt.getTime() === m.openedAt.getTime() && s.montoApertura.equals(dec(m.apertura.monto)));
    if (i < 0) throw new Error(`Sin sesión en BD para apertura #${m.apertura.idcaja_a}`);
    const db = pool.splice(i, 1)[0];
    return { ...m, id: db.id, userId, date: clean(m.apertura.fecha) };
  });
  if (pool.length) throw new Error(`${pool.length} sesiones de BD sin apertura de origen`);

  const sales = await prisma.sale.findMany({
    where: { establishmentId: est.id },
    select: { id: true, createdAt: true, sellerId: true, estado: true, cashSessionId: true, payments: { select: { metodo: true, monto: true } } },
  });
  const target = new Map<string, string[]>();
  const netCash = new Map<string, Prisma.Decimal>();
  let moved = 0;
  for (const s of sales) {
    const date = new Date(s.createdAt.getTime() - 5 * 3600e3).toISOString().slice(0, 10);
    const i = pickSessionIndex(sessions, date, s.sellerId, s.createdAt);
    const sid = i >= 0 ? sessions[i].id : null;
    if (sid !== s.cashSessionId) moved++;
    if (sid) {
      target.set(sid, [...(target.get(sid) ?? []), s.id]);
      if (s.estado !== 'ANULADA') {
        const cash = s.payments.filter((p) => p.metodo === 'EFECTIVO').reduce((a, p) => a.add(p.monto), new Prisma.Decimal(0));
        netCash.set(sid, (netCash.get(sid) ?? new Prisma.Decimal(0)).add(cash));
      }
    }
  }

  let fixedClose = 0;
  try {
    await prisma.$transaction(
      async (tx) => {
        for (const [sid, saleIds] of target) {
          await tx.sale.updateMany({ where: { id: { in: saleIds } }, data: { cashSessionId: sid } });
          await tx.cashMovement.updateMany({
            where: { saleId: { in: saleIds }, tipo: { in: [CashMovementType.VENTA, CashMovementType.ANULACION] } },
            data: { cashSessionId: sid },
          });
        }
        for (const s of sessions) {
          const c = s.cierre;
          const db = dbSessions.find((x) => x.id === s.id)!;
          const sistema = dec(s.apertura.monto).add(netCash.get(s.id) ?? 0);
          const fisico = c ? dec(c.efectivo_caja) : sistema;
          if (db.closedAt?.getTime() !== s.closedAt.getTime()) fixedClose++;
          await tx.cashSession.update({
            where: { id: s.id },
            data: {
              closedAt: s.closedAt,
              closedById: s.userId,
              montoCierreSistema: c ? dec(c.caja_sistema) : sistema,
              montoCierreFisico: fisico,
              diferenciaArqueo: c ? dec(c.diferencia) : new Prisma.Decimal(0),
              notasCierre: c ? `Migrado de BoticaJL (turno ${clean(c.turno)})` : 'Sin cierre registrado en BoticaJL',
              cierreForzado: !c,
              motivoCierreForzado: c ? null : 'Caja sin cierre en BoticaJL; cerrada en la migración',
            },
          });
          await tx.cashMovement.updateMany({
            where: { cashSessionId: s.id, tipo: CashMovementType.CIERRE },
            data: { monto: fisico, createdAt: s.closedAt },
          });
        }
        const bad = await tx.cashSession.findMany({ where: { id: { in: sessions.map((s) => s.id) } }, select: { openedAt: true, closedAt: true } });
        const inverted = bad.filter((b) => b.closedAt && b.closedAt < b.openedAt).length;
        const orphanMoves = await tx.cashMovement.count({
          where: { cashSessionId: { in: sessions.map((s) => s.id) }, tipo: CashMovementType.VENTA, sale: { cashSessionId: null } },
        });
        console.log({ sesiones: sessions.length, cierresEmparejados: sessions.filter((s) => s.cierre).length, sinCierre: sessions.filter((s) => !s.cierre).length, cierresCorregidos: fixedClose, ventasMovidas: moved, cierreAntesDeApertura: inverted, movimientosHuerfanos: orphanMoves });
        if (inverted || orphanMoves) throw new Error('La verificación falló; nada se guardó');
        if (!APPLY) throw new DryRunRollback();
      },
      { timeout: 10 * 60_000, maxWait: 60_000 },
    );
  } catch (e) {
    if (!(e instanceof DryRunRollback)) throw e;
    console.log('✓ Simulación OK (rollback). Usa --apply para guardar.');
    return;
  }
  console.log('✓ Reparación APLICADA');
}

main().catch((e) => { console.error('✗', e instanceof Error ? e.message : e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
