/**
 * Repara el kardex de los productos cuyo stock no cuadra con la suma de sus movimientos
 * (stock inicial cargado al crear/importar productos antes de que se registrara en el kardex).
 *
 * Por cada producto y almacén descuadrado crea un movimiento:
 *  - diferencia positiva → INGRESO «Inventario inicial», fechado antes de su primer movimiento,
 *    para que el saldo del kardex nunca pase por negativo;
 *  - diferencia negativa → AJUSTE de salida con fecha de hoy.
 * No toca el stock (que es el dato real de la tienda), solo completa el historial.
 *
 * Uso:
 *   npx tsx scripts/repair-opening-balances.ts --tenant <slug>            # simulación, no guarda
 *   npx tsx scripts/repair-opening-balances.ts --tenant <slug> --apply    # guarda
 *
 * Usa DATABASE_URL: revisa la base que imprime al empezar antes de usar --apply.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  InventoryMovementType,
  Prisma,
  PrismaClient,
} from '../src/generated/prisma/client';

const APPLY = process.argv.includes('--apply');
const tenantArg = process.argv.indexOf('--tenant');
const SLUG = tenantArg > 0 ? process.argv[tenantArg + 1] : undefined;
if (!SLUG) {
  console.error('Uso: repair-opening-balances.ts --tenant <slug> [--apply]');
  process.exit(1);
}

const REFERENCIA = 'REPARACION-SALDO-INICIAL';
const OPENING_CODE = 'INVENTARIO_INICIAL';
const ADJUST_OUT_CODE = 'OUT_AJUSTE_DIFERENCIA';

const url = process.env.DATABASE_URL!;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

type Mismatch = {
  productId: string;
  warehouseId: string;
  producto: string;
  almacen: string;
  esControlado: boolean;
  stock: Prisma.Decimal;
  movimientos: Prisma.Decimal;
  primerMovimiento: Date | null;
  creado: Date;
};

async function findMismatches(tenantId: string): Promise<Mismatch[]> {
  const rows = await prisma.$queryRaw<
    {
      productId: string;
      warehouseId: string;
      producto: string;
      almacen: string;
      esControlado: boolean;
      stock: Prisma.Decimal;
      movimientos: Prisma.Decimal;
      primerMovimiento: Date | null;
      creado: Date;
    }[]
  >`
    WITH mv AS (
      SELECT "productId", "warehouseId", SUM(cantidad) AS total, MIN("fechaRegistro") AS primero
      FROM "InventoryInboundMovement"
      WHERE "deletedAt" IS NULL
      GROUP BY 1, 2
    )
    SELECT pws."productId", pws."warehouseId", p.nombre AS producto, w.nombre AS almacen,
           p."esControlado", pws.cantidad AS stock, COALESCE(mv.total, 0) AS movimientos,
           mv.primero AS "primerMovimiento", p."createdAt" AS creado
    FROM "ProductWarehouseStock" pws
    JOIN "Product" p ON p.id = pws."productId"
    JOIN "Warehouse" w ON w.id = pws."warehouseId"
    JOIN "Establishment" e ON e.id = w."establishmentId"
    LEFT JOIN mv ON mv."productId" = pws."productId" AND mv."warehouseId" = pws."warehouseId"
    WHERE e."tenantId" = ${tenantId}
      AND pws.cantidad <> COALESCE(mv.total, 0)
    ORDER BY p.nombre, w.nombre`;
  return rows.map((r) => ({
    ...r,
    stock: new Prisma.Decimal(r.stock),
    movimientos: new Prisma.Decimal(r.movimientos),
  }));
}

/** La entrada inicial va antes del primer movimiento (y no después del alta del producto). */
function openingDate(m: Mismatch): Date {
  if (!m.primerMovimiento) return m.creado;
  const beforeFirst = new Date(m.primerMovimiento.getTime() - 1000);
  return beforeFirst < m.creado ? beforeFirst : m.creado;
}

async function main() {
  const host = url.replace(/\/\/[^@]*@/, '//').split('?')[0];
  console.log(`Base: ${host}`);
  console.log(`Cliente: ${SLUG} · ${APPLY ? 'GUARDANDO (--apply)' : 'simulación, no se guarda nada'}\n`);

  const tenant = await prisma.tenant.findUnique({
    where: { slug: SLUG },
    select: { id: true, nombre: true },
  });
  if (!tenant) throw new Error(`No existe el cliente con slug «${SLUG}»`);

  const [opening, adjustOut] = await Promise.all([
    prisma.inventoryTransferReason.findFirst({ where: { codigo: OPENING_CODE, deletedAt: null }, select: { id: true } }),
    prisma.inventoryTransferReason.findFirst({ where: { codigo: ADJUST_OUT_CODE, deletedAt: null }, select: { id: true } }),
  ]);
  if (!opening || !adjustOut) throw new Error(`Faltan los motivos ${OPENING_CODE} u ${ADJUST_OUT_CODE}`);

  const mismatches = await findMismatches(tenant.id);
  if (!mismatches.length) {
    console.log(`${tenant.nombre}: el stock cuadra con el kardex en todos los productos. Nada que hacer.`);
    return;
  }

  console.table(
    mismatches.map((m) => {
      const diff = m.stock.minus(m.movimientos);
      return {
        producto: m.producto.slice(0, 40),
        almacen: m.almacen.slice(0, 20),
        stock: m.stock.toNumber(),
        kardex: m.movimientos.toNumber(),
        movimiento: diff.greaterThan(0) ? `+${diff} inventario inicial` : `${diff} ajuste`,
        fecha: (diff.greaterThan(0) ? openingDate(m) : new Date()).toISOString().slice(0, 19),
        controlado: m.esControlado ? 'SÍ' : '',
      };
    }),
  );
  const controlled = mismatches.filter((m) => m.esControlado).length;
  console.log(`\n${mismatches.length} filas por reparar.`);
  if (controlled) {
    console.log(
      `${controlled} son productos controlados: su libro de psicotrópicos no se modifica; revísalo aparte.`,
    );
  }

  if (!APPLY) {
    console.log('\nSimulación: vuelve a correr con --apply para guardar.');
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const m of mismatches) {
      const diff = m.stock.minus(m.movimientos);
      const inbound = diff.greaterThan(0);
      await tx.inventoryInboundMovement.create({
        data: {
          productId: m.productId,
          warehouseId: m.warehouseId,
          transferReasonId: inbound ? opening.id : adjustOut.id,
          movementType: inbound ? InventoryMovementType.INGRESO : InventoryMovementType.AJUSTE,
          cantidad: diff,
          fechaRegistro: inbound ? openingDate(m) : new Date(),
          referencia: REFERENCIA,
          comentario: inbound
            ? 'Saldo inicial que no se registró en el kardex al crear el producto'
            : 'Ajuste para cuadrar el kardex con el stock',
        },
      });
    }
    const left = await findMismatchesTx(tx, tenant.id);
    if (left) throw new Error(`Después de reparar aún quedan ${left} filas descuadradas; no se guardó nada.`);
  });
  console.log(`\nListo: ${mismatches.length} movimientos creados (referencia ${REFERENCIA}).`);
}

async function findMismatchesTx(tx: Prisma.TransactionClient, tenantId: string): Promise<number> {
  const [{ n }] = await tx.$queryRaw<{ n: bigint }[]>`
    WITH mv AS (
      SELECT "productId", "warehouseId", SUM(cantidad) AS total
      FROM "InventoryInboundMovement" WHERE "deletedAt" IS NULL GROUP BY 1, 2
    )
    SELECT COUNT(*) AS n
    FROM "ProductWarehouseStock" pws
    JOIN "Warehouse" w ON w.id = pws."warehouseId"
    JOIN "Establishment" e ON e.id = w."establishmentId"
    LEFT JOIN mv ON mv."productId" = pws."productId" AND mv."warehouseId" = pws."warehouseId"
    WHERE e."tenantId" = ${tenantId} AND pws.cantidad <> COALESCE(mv.total, 0)`;
  return Number(n);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
