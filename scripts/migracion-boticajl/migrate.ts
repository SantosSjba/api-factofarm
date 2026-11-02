/**
 * Migración BoticaJL (Laravel/MySQL) → FactoFarm (cliente SaaS nuevo).
 *
 * Uso:
 *   npx tsx scripts/migracion-boticajl/migrate.ts <data.json> <credenciales.md>            # simulación (rollback)
 *   npx tsx scripts/migracion-boticajl/migrate.ts <data.json> <credenciales.md> --apply    # guarda
 *
 * <data.json> es el volcado de phpMyAdmin parseado a { tabla: fila[] }.
 * Las ventas se migran como NOTA_VENTA serie T001 (eran tickets internos, sin SUNAT)
 * y NO descuentan stock: el stock se carga con el saldo actual de BoticaJL.
 */
import 'dotenv/config';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  CashMovementType,
  CashSessionStatus,
  CustomerDocumentType,
  DocumentSeriesType,
  PaymentMethod,
  Prisma,
  PrismaClient,
  SaleDocumentType,
  SaleStatus,
  TenantPlan,
  TenantStatus,
  UserRole,
} from '../../src/generated/prisma/client';
import { getDefaultNavCodesForRole } from '../../src/common/permissions/role-permission-templates';
import { expandUserPermissionCodes } from '../../src/common/permissions/nav-permission-expansion';
import { modulesForPlan } from '../../src/common/tenants/tenant-plan.util';
import { validatePasswordPolicy } from '../../src/common/validators/password-policy';
import { clean, lima, matchCashSessions, pickSessionIndex } from './cash-matching';

const [dataPath, credsPath] = process.argv.slice(2);
const APPLY = process.argv.includes('--apply');
if (!dataPath || !credsPath) {
  console.error('Uso: migrate.ts <data.json> <credenciales.md> [--apply]');
  process.exit(1);
}

/** --qa: copia de prueba con otra identidad (para ensayar el POS sin tocar el cliente real). */
const QA = process.argv.includes('--qa') ? String(Date.now()).slice(-7) : null;
const TENANT = QA
  ? { nombre: `QA BOTICAJL ${QA}`, ruc: `2099${QA}`, slug: `qa-boticajl-${QA}` }
  : { nombre: 'BOTICAJL', ruc: '10724506645', slug: 'boticajl' };
const ESTABLISHMENT = QA ? `QA BOTICA J&L ${QA}` : 'BOTICA J&L';
const qaEmail = (e: string) => (QA ? `qa${QA}.${e}` : e);
const SERIE = 'T001';
const REF = 'MIGRACION-BOTICAJL';
/** Ubigeo Trujillo, La Libertad. */
const UBIGEO = { departmentId: '13', provinceId: '1301', districtId: '130101' };
const USERS: Record<string, { email: string; role: UserRole }> = {
  admin: { email: qaEmail('admin.boticajl@factofarm.com'), role: UserRole.ADMINISTRADOR },
  leidy2025: { email: qaEmail('leidy.boticajl@factofarm.com'), role: UserRole.ADMINISTRADOR },
  esmeraldac: { email: qaEmail('esmeralda.boticajl@factofarm.com'), role: UserRole.CAJERO },
};
const GENERIC_LOTS = new Set(['SIN LOTE', 'S/LOTE']);
const GENERIC_CODES = new Set(['S/LOTE', 'SIN LOTE', 'SIN CODIGO']);
const UNIT_MAP: Record<string, string> = { NIU: 'NIU', ZZ: 'ZZ', BX: 'CAJ', W2: 'KGM', H2: 'LTR' };

type Row = Record<string, string | null>;
const raw = JSON.parse(readFileSync(dataPath, 'utf8')) as Record<string, Row[]>;
const d: Record<string, Row[]> = {};
for (const [t, rows] of Object.entries(raw)) {
  d[t] = rows.map((r) =>
    Object.fromEntries(
      Object.entries(r).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]),
    ),
  );
}

const s = clean;
const dec = (v: string | null | undefined) => new Prisma.Decimal(s(v) || '0');
function tempPassword(): string {
  const p = `Bjl-${randomBytes(6).toString('base64url')}9a!`;
  if (!validatePasswordPolicy(p).valid) return tempPassword();
  return p;
}
const byId = <T extends Row>(rows: T[], key: string) => new Map(rows.map((r) => [s(r[key]), r]));
function chunk<T>(arr: T[], size = 1000): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

class DryRunRollback extends Error {}

async function main() {
  const existing = await prisma.tenant.findFirst({
    where: { OR: [{ ruc: TENANT.ruc }, { slug: TENANT.slug }] },
    select: { id: true, nombre: true },
  });
  if (existing) throw new Error(`Ya existe el cliente ${existing.nombre} (${existing.id}). Aborto.`);
  const emails = Object.values(USERS).map((u) => u.email);
  const taken = await prisma.user.findMany({ where: { email: { in: emails } }, select: { email: true } });
  if (taken.length) throw new Error(`Correos ya registrados: ${taken.map((t) => t.email).join(', ')}`);

  const units = new Map((await prisma.unitOfMeasure.findMany()).map((u) => [u.codigo, u.id]));
  const taxes = new Map((await prisma.taxAffectationType.findMany()).map((t) => [t.codigo, t.id]));
  const pen = await prisma.currency.findUniqueOrThrow({ where: { codigo: 'PEN' } });
  const initialReason = await prisma.inventoryTransferReason.findUniqueOrThrow({
    where: { codigo: 'INVENTARIO_INICIAL' },
  });

  // Credenciales temporales generadas fuera de la transacción (bcrypt es lento).
  const creds = new Map<string, { password: string; hash: string }>();
  for (const key of Object.keys(USERS)) {
    const password = tempPassword();
    creds.set(key, { password, hash: await bcrypt.hash(password, 10) });
  }

  const summary: Record<string, unknown> = {};
  const credLines: string[] = [];

  try {
    await prisma.$transaction(
      async (tx) => {
        // 1. Cliente SaaS + establecimiento + almacén + caja + serie.
        const tenant = await tx.tenant.create({
          data: {
            nombre: TENANT.nombre,
            ruc: TENANT.ruc,
            slug: TENANT.slug,
            plan: TenantPlan.BOTICA,
            status: TenantStatus.ACTIVE,
            activatedAt: new Date(),
            maxEstablishments: 1,
            maxUsers: 3,
            contactName: 'Leidy Bernui Baltazar',
            contactEmail: USERS.leidy2025.email,
            notes: 'Migrado desde boticajl.factosysperu.com (BoticaJL Laravel) el 02/11/2026.',
            enabledModules: modulesForPlan(TenantPlan.BOTICA),
          },
        });
        const est = await tx.establishment.create({
          data: {
            tenantId: tenant.id,
            nombre: ESTABLISHMENT,
            ...UBIGEO,
            correoContacto: USERS.leidy2025.email,
          },
        });
        const wh = await tx.warehouse.create({
          data: { establishmentId: est.id, nombre: 'Almacén Principal' },
        });
        await tx.establishmentSeries.create({
          data: { establishmentId: est.id, documentType: DocumentSeriesType.NOTA_VENTA, numero: SERIE },
        });
        const register = await tx.cashRegister.create({
          data: { establishmentId: est.id, nombre: 'Caja 1' },
        });

        // 2. Usuarios con permisos del rol (mismo criterio que TenantsService.provision).
        const userIdByLogin = new Map<string, string>();
        const userIdByOldId = new Map<string, string>();
        for (const u of d.usuario) {
          const key = s(u.usuario).toLowerCase();
          const cfg = USERS[key];
          if (!cfg) throw new Error(`Usuario sin mapeo: ${u.usuario}`);
          const user = await tx.user.create({
            data: {
              nombre: s(u.nombres),
              email: cfg.email,
              passwordHash: creds.get(key)!.hash,
              role: cfg.role,
              tenantId: tenant.id,
              establecimientoId: est.id,
            },
          });
          const codes = expandUserPermissionCodes(getDefaultNavCodesForRole(cfg.role), cfg.role);
          const perms = await tx.permission.findMany({ where: { code: { in: codes } }, select: { id: true } });
          await tx.userPermission.createMany({
            data: perms.map((p) => ({ userId: user.id, permissionId: p.id })),
            skipDuplicates: true,
          });
          userIdByLogin.set(key, user.id);
          userIdByOldId.set(s(u.idusu), user.id);
          credLines.push(`| ${s(u.nombres)} | ${s(u.usuario)} | ${cfg.role} | ${cfg.email} | \`${creds.get(key)!.password}\` |`);
        }
        const fallbackSeller = userIdByLogin.get('admin')!;

        // 3. Proveedores (los "laboratorios" de BoticaJL) y clientes.
        const supplierKeys = new Set<string>();
        const suppliers: Prisma.SupplierCreateManyInput[] = [];
        for (const c of d.cliente.filter((c) => s(c.tipo) === 'laboratorio')) {
          const nombre = s(c.nombres);
          if (/^SIN LABORATORIO$/i.test(nombre)) continue;
          const doc = s(c.nrodoc).replace(/\D/g, '');
          const isRuc = /^(10|15|17|20)\d{9}$/.test(doc);
          const tipoDocumento = isRuc ? CustomerDocumentType.RUC : CustomerDocumentType.DOC_SIN_RUC;
          let numero = isRuc ? doc : `BJL-${s(c.idcliente)}`;
          if (supplierKeys.has(`${tipoDocumento}:${numero}`)) numero = `${numero}-${s(c.idcliente)}`;
          supplierKeys.add(`${tipoDocumento}:${numero}`);
          suppliers.push({
            id: randomUUID(),
            tenantId: tenant.id,
            razonSocial: nombre,
            tipoDocumento,
            numeroDocumento: numero,
            direccion: s(c.direccion) || null,
            observaciones: `Migrado de BoticaJL (laboratorio #${s(c.idcliente)})`,
          });
        }
        await tx.supplier.createMany({ data: suppliers });

        // "PUBLICO EN GENERAL" 00000000 = venta sin cliente; los demás clientes reales se crean.
        const customerIdByOld = new Map<string, string>();
        for (const c of d.cliente.filter((c) => s(c.tipo) === 'cliente')) {
          const doc = s(c.nrodoc);
          if (!doc || /^0+$/.test(doc)) continue;
          const tipoDocumento = doc.length === 11 ? CustomerDocumentType.RUC : CustomerDocumentType.DNI;
          const cust = await tx.customer.create({
            data: {
              tenantId: tenant.id,
              nombre: s(c.nombres).toUpperCase(),
              tipoDocumento,
              numeroDocumento: doc,
              observaciones: `Migrado de BoticaJL (cliente #${s(c.idcliente)})`,
            },
          });
          customerIdByOld.set(s(c.idcliente), cust.id);
        }

        // 4. Productos + stock + lotes + movimiento de inventario inicial.
        const lots = byId(d.lote, 'idlote');
        const labs = byId(d.cliente, 'idcliente');
        const cats = byId(d.categoria, 'idcategoria');
        const pres = byId(d.presentacion, 'idpresentacion');
        const unidades = byId(d.unidad, 'iduni');
        const tiposAf = byId(d.tipo_afectacion, 'idtipoa');
        const codeCount = new Map<string, number>();
        for (const p of d.productos) {
          const c = s(p.codigo).toUpperCase();
          if (c) codeCount.set(c, (codeCount.get(c) ?? 0) + 1);
        }

        const productIdByOld = new Map<string, string>();
        const products: Prisma.ProductCreateManyInput[] = [];
        const whStocks: Prisma.ProductWarehouseStockCreateManyInput[] = [];
        const lotStocks: Prisma.ProductLotStockCreateManyInput[] = [];
        const inbound: Prisma.InventoryInboundMovementCreateManyInput[] = [];
        const unitUsage: Record<string, number> = {};
        const now = new Date();

        for (const p of d.productos) {
          const id = randomUUID();
          productIdByOld.set(s(p.idproducto), id);
          const lot = lots.get(s(p.idlote));
          const lotNumber = s(lot?.numero).toUpperCase();
          const realLot = !!lot && !!lotNumber && !GENERIC_LOTS.has(lotNumber);
          const vto = realLot && s(lot!.fecha_vencimiento) ? lima(s(lot!.fecha_vencimiento)) : null;
          const code = s(p.codigo);
          const codeOk = code && !GENERIC_CODES.has(code.toUpperCase()) && codeCount.get(code.toUpperCase()) === 1;
          const unitCode = s(unidades.get(s(p.idunidad))?.codigo);
          const ffUnit = UNIT_MAP[unitCode] ?? 'NIU';
          unitUsage[`${unitCode}->${ffUnit}`] = (unitUsage[`${unitCode}->${ffUnit}`] ?? 0) + 1;
          const taxCode = s(tiposAf.get(s(p.idtipoaf))?.codigo) || '10';
          const lab = s(labs.get(s(p.idcliente))?.nombres);
          const forma = s(cats.get(s(p.idcategoria))?.forma_farmaceutica);
          const presentacion = s(pres.get(s(p.idpresentacion))?.presentacion);
          const stock = dec(p.stock);
          const costo = dec(p.precio_compra);

          products.push({
            id,
            tenantId: tenant.id,
            nombre: s(p.descripcion),
            descripcion: presentacion && presentacion !== 'UNIDAD' ? `Presentación: ${presentacion}` : null,
            codigoInterno: codeOk ? code : null,
            registroSanitario: s(p.reg_sanitario) || null,
            formaFarmaceutica: forma && !/no aplica/i.test(forma) ? forma : null,
            marcaLaboratorio: lab && !/^SIN LABORATORIO$/i.test(lab) ? lab : null,
            unitId: units.get(ffUnit)!,
            currencyId: pen.id,
            saleTaxAffectationId: taxes.get(taxCode)!,
            purchaseTaxAffectationId: taxes.get(taxCode)!,
            precioUnitarioVenta: dec(p.precio_venta),
            precioUnitarioCompra: costo,
            costoUnitario: costo,
            generico: s(p.tipo) === 'Generico',
            necesitaRecetaMedica: /con receta/i.test(s(p.ventasujeta)),
            manejaLotes: realLot,
            codigoLote: realLot ? lotNumber : null,
            fechaVencimientoLote: vto,
            stockMinimo: Math.max(0, Number.parseInt(s(p.stockminimo) || '1', 10)),
            defaultWarehouseId: wh.id,
            createdAt: s(p.fecha_registro) ? lima(s(p.fecha_registro)) : now,
          });
          whStocks.push({ id: randomUUID(), productId: id, warehouseId: wh.id, cantidad: stock });
          if (stock.greaterThan(0)) {
            if (realLot) {
              lotStocks.push({
                id: randomUUID(),
                productId: id,
                warehouseId: wh.id,
                codigoLote: lotNumber,
                stock,
                costoUnitario: costo,
                fechaVencimiento: vto,
              });
            }
            inbound.push({
              id: randomUUID(),
              productId: id,
              warehouseId: wh.id,
              transferReasonId: initialReason.id,
              cantidad: stock,
              costoUnitario: costo,
              codigoLote: realLot ? lotNumber : null,
              fechaVencimiento: vto,
              fechaRegistro: now,
              referencia: REF,
              comentario: 'Saldo inicial migrado de BoticaJL',
              userId: fallbackSeller,
            });
          }
        }
        for (const part of chunk(products)) await tx.product.createMany({ data: part });
        for (const part of chunk(whStocks)) await tx.productWarehouseStock.createMany({ data: part });
        for (const part of chunk(lotStocks)) await tx.productLotStock.createMany({ data: part });
        for (const part of chunk(inbound)) await tx.inventoryInboundMovement.createMany({ data: part });

        // 5. Sesiones de caja (cada cierre ↔ última apertura del mismo usuario y caja).
        type Sess = { id: string; userId: string; openedAt: Date; closedAt: Date; date: string; montoApertura: Prisma.Decimal; cierre?: Row };
        const sessions: Sess[] = matchCashSessions(d.caja_apertura, d.caja_cierre, now).map((m) => ({
          id: randomUUID(),
          userId: userIdByLogin.get(m.user) ?? fallbackSeller,
          openedAt: m.openedAt,
          closedAt: m.closedAt,
          date: s(m.apertura.fecha),
          montoApertura: dec(m.apertura.monto),
          cierre: m.cierre,
        }));
        const pickSession = (date: string, userId: string, at: Date) => {
          const i = pickSessionIndex(sessions, date, userId, at);
          return i >= 0 ? sessions[i] : undefined;
        };

        // 6. Ventas + detalle + pagos + movimientos de caja.
        const series = byId(d.serie, 'idserie');
        const pagosByVenta = new Map<string, Row[]>();
        for (const pg of d.pago_venta) pagosByVenta.set(s(pg.idventa), [...(pagosByVenta.get(s(pg.idventa)) ?? []), pg]);
        const itemsByVenta = new Map<string, Row[]>();
        for (const it of d.detalleventa) itemsByVenta.set(s(it.idventa), [...(itemsByVenta.get(s(it.idventa)) ?? []), it]);

        const sales: Prisma.SaleCreateManyInput[] = [];
        const items: Prisma.SaleItemCreateManyInput[] = [];
        const payments: Prisma.PaymentCreateManyInput[] = [];
        const moves: Prisma.CashMovementCreateManyInput[] = [];
        const cashBySession = new Map<string, Prisma.Decimal>();
        const usedNumbers = new Set<string>();
        let noSession = 0;

        for (const v of d.venta) {
          const id = randomUUID();
          const [date, time] = s(v.fecha_emision).split(' ');
          const at = lima(date, time ?? '00:00:00');
          const sellerId = userIdByOldId.get(s(v.idusuario)) ?? fallbackSeller;
          const sess = pickSession(date, sellerId, at);
          if (!sess) noSession++;
          let numero = String(Number(s(series.get(s(v.idserie))?.correlativo)) || Number(v.idventa)).padStart(8, '0');
          if (usedNumbers.has(numero)) numero = String(900000 + Number(v.idventa)).padStart(8, '0');
          usedNumbers.add(numero);
          const anulada = s(v.estado) === 'anulado';
          const subtotal = dec(v.op_gravadas).add(dec(v.op_exoneradas)).add(dec(v.op_inafectas));

          sales.push({
            id,
            establishmentId: est.id,
            warehouseId: wh.id,
            cashSessionId: sess?.id ?? null,
            customerId: customerIdByOld.get(s(v.idcliente)) ?? null,
            sellerId,
            documentType: SaleDocumentType.NOTA_VENTA,
            serie: SERIE,
            numero,
            estado: anulada ? SaleStatus.ANULADA : SaleStatus.COMPLETADA,
            subtotal,
            igvTotal: dec(v.igv),
            total: dec(v.total),
            voidReason: anulada ? 'Anulada en BoticaJL' : null,
            voidedById: anulada ? sellerId : null,
            voidedAt: anulada ? at : null,
            comentario: `Migrado de BoticaJL (venta #${s(v.idventa)})`,
            createdAt: at,
            updatedAt: at,
          });
          for (const it of itemsByVenta.get(s(v.idventa)) ?? []) {
            items.push({
              id: randomUUID(),
              saleId: id,
              productId: productIdByOld.get(s(it.idproducto))!,
              cantidad: dec(it.cantidad),
              precioUnitario: dec(it.precio_unitario),
              subtotalLinea: dec(it.valor_total),
              igvLinea: dec(it.igv),
              totalLinea: dec(it.importe_total),
            });
          }

          let pays = (pagosByVenta.get(s(v.idventa)) ?? []).map((pg) => ({
            metodo: s(pg.tipo_pago).toUpperCase() === 'YAPE' ? PaymentMethod.YAPE : PaymentMethod.EFECTIVO,
            monto: dec(pg.monto),
            referencia: s(pg.numope) || null,
          }));
          if (!pays.length) {
            const fp = s(v.formadepago).toUpperCase();
            const metodo = fp === 'YAPE' ? PaymentMethod.YAPE : fp === 'EFECTIVO' ? PaymentMethod.EFECTIVO : PaymentMethod.MIXTO;
            pays = [{ metodo, monto: dec(v.total), referencia: s(v.numope) || null }];
          }
          let cash = new Prisma.Decimal(0);
          for (const p of pays) {
            payments.push({ id: randomUUID(), saleId: id, metodo: p.metodo, monto: p.monto, referencia: p.referencia });
            if (p.metodo === PaymentMethod.EFECTIVO) cash = cash.add(p.monto);
          }
          if (sess && cash.greaterThan(0)) {
            moves.push({
              id: randomUUID(), cashSessionId: sess.id, tipo: CashMovementType.VENTA, monto: cash,
              metodoPago: PaymentMethod.EFECTIVO, saleId: id, referencia: `${SERIE}-${numero}`, createdAt: at,
            });
            let net = cash;
            if (anulada) {
              moves.push({
                id: randomUUID(), cashSessionId: sess.id, tipo: CashMovementType.ANULACION, monto: cash.negated(),
                metodoPago: PaymentMethod.EFECTIVO, saleId: id, comentario: 'Anulada en BoticaJL', createdAt: at,
              });
              net = new Prisma.Decimal(0);
            }
            cashBySession.set(sess.id, (cashBySession.get(sess.id) ?? new Prisma.Decimal(0)).add(net));
          }
        }

        // Sesiones: se crean antes que las ventas que las referencian.
        const sessionRows: Prisma.CashSessionCreateManyInput[] = [];
        for (const ss of sessions) {
          const c = ss.cierre;
          const sistema = ss.montoApertura.add(cashBySession.get(ss.id) ?? 0);
          const closedAt = ss.closedAt;
          const fisico = c ? dec(c.efectivo_caja) : sistema;
          sessionRows.push({
            id: ss.id,
            cashRegisterId: register.id,
            userId: ss.userId,
            estado: CashSessionStatus.CERRADA,
            montoApertura: ss.montoApertura,
            montoCierreSistema: c ? dec(c.caja_sistema) : sistema,
            montoCierreFisico: fisico,
            diferenciaArqueo: c ? dec(c.diferencia) : new Prisma.Decimal(0),
            notasCierre: c ? `Migrado de BoticaJL (turno ${clean(c.turno)})` : 'Sin cierre registrado en BoticaJL',
            openedAt: ss.openedAt,
            closedAt,
            closedById: ss.userId,
            cierreForzado: !c,
            motivoCierreForzado: c ? null : 'Caja sin cierre en BoticaJL; cerrada en la migración',
          });
          moves.push(
            { id: randomUUID(), cashSessionId: ss.id, tipo: CashMovementType.APERTURA, monto: ss.montoApertura,
              metodoPago: PaymentMethod.EFECTIVO, comentario: 'Apertura de caja', createdAt: ss.openedAt },
            { id: randomUUID(), cashSessionId: ss.id, tipo: CashMovementType.CIERRE, monto: fisico,
              metodoPago: PaymentMethod.EFECTIVO, comentario: 'Cierre de caja', createdAt: closedAt },
          );
        }
        for (const part of chunk(sessionRows)) await tx.cashSession.createMany({ data: part });
        for (const part of chunk(sales)) await tx.sale.createMany({ data: part });
        for (const part of chunk(items, 2000)) await tx.saleItem.createMany({ data: part });
        for (const part of chunk(payments, 2000)) await tx.payment.createMany({ data: part });
        for (const part of chunk(moves, 2000)) await tx.cashMovement.createMany({ data: part });

        // 7. Verificación dentro de la transacción.
        const sumTotal = await tx.sale.aggregate({ where: { establishmentId: est.id }, _sum: { total: true }, _count: true });
        const sumStock = await tx.productWarehouseStock.aggregate({ where: { warehouseId: wh.id }, _sum: { cantidad: true } });
        const srcTotal = d.venta.reduce((a, v) => a.add(dec(v.total)), new Prisma.Decimal(0));
        const srcStock = d.productos.reduce((a, p) => a.add(dec(p.stock)), new Prisma.Decimal(0));
        Object.assign(summary, {
          tenantId: tenant.id,
          establishmentId: est.id,
          usuarios: userIdByLogin.size,
          proveedores: suppliers.length,
          clientes: customerIdByOld.size,
          productos: products.length,
          productosConLote: products.filter((p) => p.manejaLotes).length,
          lotesConStock: lotStocks.length,
          movimientosInventarioInicial: inbound.length,
          unidades: unitUsage,
          sesionesCaja: sessionRows.length,
          sesionesSinCierreEnOrigen: sessionRows.filter((x) => x.cierreForzado).length,
          ventas: sumTotal._count,
          ventasSinSesion: noSession,
          itemsVenta: items.length,
          pagos: payments.length,
          movimientosCaja: moves.length,
          totalVentasOrigen: srcTotal.toFixed(2),
          totalVentasDestino: new Prisma.Decimal(sumTotal._sum.total ?? 0).toFixed(2),
          stockOrigen: srcStock.toFixed(0),
          stockDestino: new Prisma.Decimal(sumStock._sum.cantidad ?? 0).toFixed(0),
        });
        if (!srcTotal.equals(sumTotal._sum.total ?? 0)) throw new Error('El total de ventas no cuadra');
        if (!srcStock.equals(sumStock._sum.cantidad ?? 0)) throw new Error('El stock total no cuadra');
        if (sumTotal._count !== d.venta.length) throw new Error('La cantidad de ventas no cuadra');

        if (!APPLY) throw new DryRunRollback();
      },
      { timeout: 15 * 60_000, maxWait: 60_000 },
    );
  } catch (err) {
    if (!(err instanceof DryRunRollback)) throw err;
  }

  console.log(JSON.stringify(summary, null, 2));
  if (APPLY) {
    writeFileSync(
      credsPath,
      [
        '# Credenciales temporales BoticaJL en FactoFarm',
        '',
        'No subir a git. Cambiar las contraseñas en el primer ingreso.',
        '',
        '| Nombre | Usuario BoticaJL | Rol | Correo | Contraseña temporal |',
        '|---|---|---|---|---|',
        ...credLines,
        '',
      ].join('\n'),
      { mode: 0o600 },
    );
    console.log(`✓ Migración APLICADA. Credenciales en ${credsPath}`);
  } else {
    console.log('✓ Simulación OK: todo se deshizo (rollback). Usa --apply para guardar.');
  }
}

main()
  .catch((err) => {
    console.error('✗', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
