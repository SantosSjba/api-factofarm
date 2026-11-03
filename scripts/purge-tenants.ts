/**
 * Elimina por completo clientes SaaS (tenants) y todo lo que depende de ellos.
 *
 * Recorre las FK de PostgreSQL desde `tenants`: los hijos con ON DELETE RESTRICT / NO ACTION / CASCADE
 * se borran (de lo más profundo hacia arriba); los SET NULL los resuelve la propia BD.
 * Antes de confirmar verifica que los clientes conservados no pierdan filas.
 *
 * Uso: npx tsx scripts/purge-tenants.ts <slug> [<slug> ...] [--allow-fiscal-delete] [--apply]
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../src/generated/prisma/client';

const APPLY = process.argv.includes('--apply');
/** Permite borrar ventas/pagos de clientes de prueba saltando la inmutabilidad fiscal (solo en la transacción). */
const ALLOW_FISCAL = process.argv.includes('--allow-fiscal-delete');
const slugs = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
class DryRunRollback extends Error {}

type Fk = { child: string; childCol: string; parent: string; parentCol: string; action: string };
const q = (id: string) => `"${id.replace(/"/g, '""')}"`;

async function main() {
  if (!slugs.length) throw new Error('Indique al menos un slug');
  const tenants = await prisma.tenant.findMany({ where: { slug: { in: slugs } }, select: { id: true, nombre: true, slug: true } });
  const missing = slugs.filter((s) => !tenants.some((t) => t.slug === s));
  if (missing.length) throw new Error(`Slugs no encontrados: ${missing.join(', ')}`);
  const kept = await prisma.tenant.findMany({ where: { slug: { notIn: slugs } }, select: { id: true, nombre: true } });

  const fks = await prisma.$queryRawUnsafe<Fk[]>(`
    SELECT cl.relname AS child, a.attname AS "childCol", pl.relname AS parent, pa.attname AS "parentCol",
           c.confdeltype::text AS action
    FROM pg_constraint c
    JOIN pg_class cl ON cl.oid = c.conrelid
    JOIN pg_class pl ON pl.oid = c.confrelid
    JOIN pg_namespace n ON n.oid = cl.relnamespace AND n.nspname = current_schema()
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
    JOIN pg_attribute pa ON pa.attrelid = c.confrelid AND pa.attnum = c.confkey[1]
    WHERE c.contype = 'f' AND array_length(c.conkey, 1) = 1`);
  const tenantTable = (await prisma.$queryRawUnsafe<{ t: string }[]>(
    `SELECT c.relname AS t FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = current_schema() AND c.relname IN ('tenants','Tenant') LIMIT 1`))[0].t;

  /** table → col → valores a borrar */
  const targets = new Map<string, Map<string, Set<string>>>();
  const depth = new Map<string, number>();
  const add = (table: string, col: string, values: string[]) => {
    const byCol = targets.get(table) ?? new Map<string, Set<string>>();
    targets.set(table, byCol);
    const set = byCol.get(col) ?? new Set<string>();
    byCol.set(col, set);
    const fresh = values.filter((v) => !set.has(v));
    fresh.forEach((v) => set.add(v));
    return fresh;
  };

  // BFS: (tabla, columna, valores) → filas → valores de columnas referenciadas por hijos → hijos.
  const queue: { table: string; col: string; values: string[]; d: number }[] = [
    { table: tenantTable, col: 'id', values: tenants.map((t) => t.id), d: 0 },
  ];
  add(tenantTable, 'id', tenants.map((t) => t.id));
  while (queue.length) {
    const { table, col, values, d } = queue.shift()!;
    if (!values.length) continue;
    depth.set(table, Math.max(depth.get(table) ?? 0, d));
    for (const fk of fks.filter((f) => f.parent === table && f.action !== 'n' && f.action !== 'd')) {
      // a = NO ACTION, r = RESTRICT, c = CASCADE → el hijo debe desaparecer. n = SET NULL, d = SET DEFAULT → lo resuelve la BD.
      const parentVals = await prisma.$queryRawUnsafe<{ v: string }[]>(
        `SELECT DISTINCT ${q(fk.parentCol)}::text AS v FROM ${q(table)} WHERE ${q(col)}::text = ANY($1::text[]) AND ${q(fk.parentCol)} IS NOT NULL`,
        values,
      );
      if (!parentVals.length) continue;
      const childRows = await prisma.$queryRawUnsafe<{ v: string }[]>(
        `SELECT DISTINCT ${q(fk.childCol)}::text AS v FROM ${q(fk.child)} WHERE ${q(fk.childCol)}::text = ANY($1::text[])`,
        parentVals.map((r) => r.v),
      );
      const fresh = add(fk.child, fk.childCol, childRows.map((r) => r.v));
      if (fresh.length) queue.push({ table: fk.child, col: fk.childCol, values: fresh, d: d + 1 });
    }
  }

  // Conteo previo por tabla.
  const plan: { table: string; d: number; rows: number }[] = [];
  for (const [table, byCol] of targets) {
    const where = [...byCol].map(([c], i) => `${q(c)}::text = ANY($${i + 1}::text[])`).join(' OR ');
    const [{ n }] = await prisma.$queryRawUnsafe<{ n: bigint }[]>(
      `SELECT count(*) AS n FROM ${q(table)} WHERE ${where}`,
      ...[...byCol.values()].map((s) => [...s]),
    );
    plan.push({ table, d: depth.get(table) ?? 0, rows: Number(n) });
  }
  // Orden topológico por FK reales: una tabla se borra antes que las tablas a las que referencia
  // (la profundidad del recorrido no basta: una tabla puede colgar de dos padres a distinta altura).
  const tables = new Set(plan.map((p) => p.table));
  const parentsOf = new Map<string, Set<string>>();
  for (const fk of fks) {
    if (fk.child === fk.parent || !tables.has(fk.child) || !tables.has(fk.parent)) continue;
    if (fk.action === 'n' || fk.action === 'd') continue;
    parentsOf.set(fk.child, (parentsOf.get(fk.child) ?? new Set()).add(fk.parent));
  }
  const ordered: string[] = [];
  const remaining = new Set(tables);
  while (remaining.size) {
    // Hojas: tablas de las que ninguna otra pendiente depende.
    const leaves = [...remaining].filter((t) => ![...remaining].some((o) => parentsOf.get(o)?.has(t)));
    const batch = leaves.length ? leaves : [...remaining].sort((a, b) => (depth.get(b) ?? 0) - (depth.get(a) ?? 0)).slice(0, 1);
    for (const t of batch.sort()) {
      ordered.push(t);
      remaining.delete(t);
    }
  }
  plan.sort((a, b) => ordered.indexOf(a.table) - ordered.indexOf(b.table));

  // Huella de los clientes conservados (filas por tabla con tenantId directo + ventas/productos).
  const snapshot = async (db: Prisma.TransactionClient | PrismaClient) => {
    const ids = kept.map((k) => k.id);
    const tenantCols = await db.$queryRawUnsafe<{ t: string }[]>(
      `SELECT table_name AS t FROM information_schema.columns WHERE table_schema = current_schema() AND column_name = 'tenantId'`);
    const out: Record<string, number> = {};
    for (const { t } of tenantCols) {
      const [{ n }] = await db.$queryRawUnsafe<{ n: bigint }[]>(`SELECT count(*) AS n FROM ${q(t)} WHERE "tenantId" = ANY($1::text[])`, ids);
      out[t] = Number(n);
    }
    out.sales = await db.sale.count({ where: { establishment: { tenantId: { in: ids } } } });
    out.saleItems = await db.saleItem.count({ where: { sale: { establishment: { tenantId: { in: ids } } } } });
    out.cashSessions = await db.cashSession.count({ where: { cashRegister: { establishment: { tenantId: { in: ids } } } } });
    out.lotStocks = await db.productLotStock.count({ where: { product: { tenantId: { in: ids } } } });
    out.userPermissions = await db.userPermission.count({ where: { user: { tenantId: { in: ids } } } });
    return out;
  };
  const before = await snapshot(prisma);

  console.log(`Eliminar: ${tenants.map((t) => `${t.nombre} (${t.slug})`).join(' | ')}`);
  console.log(`Conservar: ${kept.map((k) => k.nombre).join(' | ')}`);
  for (const p of plan) console.log(`  ${String(p.rows).padStart(7)}  ${p.table}`);
  console.log(`  ${String(plan.reduce((a, p) => a + p.rows, 0)).padStart(7)}  TOTAL`);

  try {
    await prisma.$transaction(
      async (tx) => {
        // Tablas fiscales (trigger trg_prevent_fiscal_delete): se desactiva solo dentro de esta transacción.
        const fiscal = (await tx.$queryRawUnsafe<{ t: string }[]>(
          `SELECT c.relname AS t FROM pg_trigger tg JOIN pg_class c ON c.oid = tg.tgrelid
           JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = current_schema()
           WHERE tg.tgname = 'trg_prevent_fiscal_delete'`)).map((r) => r.t).filter((t) => targets.has(t));
        if (fiscal.length && !ALLOW_FISCAL) throw new Error(`Tablas fiscales afectadas (${fiscal.join(', ')}): use --allow-fiscal-delete`);
        for (const t of fiscal) await tx.$executeRawUnsafe(`ALTER TABLE ${q(t)} DISABLE TRIGGER trg_prevent_fiscal_delete`);
        for (const p of plan) {
          const byCol = targets.get(p.table)!;
          const where = [...byCol].map(([c], i) => `${q(c)}::text = ANY($${i + 1}::text[])`).join(' OR ');
          await tx.$executeRawUnsafe(`DELETE FROM ${q(p.table)} WHERE ${where}`, ...[...byCol.values()].map((s) => [...s]));
        }
        for (const t of fiscal) await tx.$executeRawUnsafe(`ALTER TABLE ${q(t)} ENABLE TRIGGER trg_prevent_fiscal_delete`);
        const off = await tx.$queryRawUnsafe<{ n: bigint }[]>(
          `SELECT count(*) AS n FROM pg_trigger WHERE tgname = 'trg_prevent_fiscal_delete' AND tgenabled = 'D'`);
        if (Number(off[0].n)) throw new Error('El trigger fiscal quedó desactivado');
        if (fiscal.length) console.log(`✓ Trigger fiscal reactivado en ${fiscal.join(', ')}`);
        const after = await snapshot(tx);
        const diff = Object.keys(before).filter((k) => before[k] !== after[k]).map((k) => `${k}: ${before[k]} → ${after[k]}`);
        if (diff.length) throw new Error(`Los clientes conservados cambiarían: ${diff.join(', ')}`);
        const left = await tx.tenant.count({ where: { id: { in: tenants.map((t) => t.id) } } });
        if (left) throw new Error('Quedaron tenants sin borrar');
        console.log('✓ Clientes conservados intactos:', JSON.stringify({ sales: after.sales, products: after.products ?? after.Product, users: after.users }));
        if (!APPLY) throw new DryRunRollback();
      },
      { timeout: 10 * 60_000, maxWait: 60_000 },
    );
  } catch (e) {
    if (!(e instanceof DryRunRollback)) throw e;
    console.log('✓ Simulación OK (rollback). Usa --apply para borrar.');
    return;
  }
  console.log('✓ Clientes eliminados');
}

main().catch((e) => { console.error('✗', e instanceof Error ? e.message : e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
