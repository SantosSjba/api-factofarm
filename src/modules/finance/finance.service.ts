import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BankMovementType,
  PaymentMethod,
  Prisma,
  SaleStatus,
} from '../../generated/prisma/client';
import {
  buildPaginatedResult,
  paginationArgs,
} from '../../common/dto/pagination.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  dateRangeBoundsInTimeZone,
  formatDateYmdInTimeZone,
  monthBoundsInTimeZone,
  normalizeTimeZone,
} from '../../common/utils/timezone.util';
import {
  AccountingExportQueryDto,
  BankMovementListQueryDto,
  CreateBankAccountDto,
  CreateBankMovementDto,
  FinancePeriodQueryDto,
  GeneralLedgerQueryDto,
  PurchaseBudgetReportQueryDto,
  RecentPaymentsQueryDto,
  UpsertPurchaseBudgetDto,
} from './dto/finance.dto';

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  /**
   * Flujo de caja (base efectivo): entra lo cobrado (ventas al contado + cobros de cuentas por
   * cobrar) y sale lo pagado (pagos a proveedores + devoluciones al contado). Antes se sumaban
   * ventas totales y además sus cobros (doble conteo del crédito), y compras devengadas además
   * de sus pagos.
   */
  async getCashFlow(establishmentId: string, query: FinancePeriodQueryDto) {
    const { from, to } = await this.parseRange(establishmentId, query);
    const saleInRange = {
      establishmentId,
      deletedAt: null,
      createdAt: { gte: from, lt: to },
      // Anulada sin devoluciones = venta dejada sin efecto: no hubo cobro neto.
      OR: [{ estado: { not: SaleStatus.ANULADA } }, { returns: { some: {} } }],
    } satisfies Prisma.SaleWhereInput;

    const [
      salesCount,
      salePayments,
      purchasesAgg,
      apPayments,
      arPayments,
      cashMovements,
      returns,
    ] = await Promise.all([
      this.prisma.sale.count({ where: saleInRange }),
      this.prisma.payment.aggregate({
        where: {
          metodo: { not: PaymentMethod.CREDITO },
          sale: saleInRange,
        },
        _sum: { monto: true },
      }),
      this.prisma.accountPayable.aggregate({
        where: {
          establishmentId,
          deletedAt: null,
          fechaEmision: { gte: from, lt: to },
        },
        _sum: { montoTotal: true },
        _count: true,
      }),
      this.prisma.accountPayablePayment.aggregate({
        where: {
          fechaPago: { gte: from, lt: to },
          accountPayable: { establishmentId, deletedAt: null },
        },
        _sum: { monto: true },
        _count: true,
      }),
      this.prisma.accountReceivablePayment.aggregate({
        where: {
          pagadoAt: { gte: from, lt: to },
          accountReceivable: { establishmentId, deletedAt: null },
        },
        _sum: { monto: true },
        _count: true,
      }),
      this.prisma.cashMovement.aggregate({
        where: {
          createdAt: { gte: from, lt: to },
          cashSession: { cashRegister: { establishmentId } },
        },
        _sum: { monto: true },
        _count: true,
      }),
      this.prisma.saleReturn.findMany({
        where: {
          createdAt: { gte: from, lt: to },
          sale: { establishmentId, deletedAt: null },
        },
        select: {
          totalDevuelto: true,
          sale: {
            select: {
              total: true,
              payments: { select: { metodo: true, monto: true } },
            },
          },
        },
      }),
    ]);

    const zero = new Prisma.Decimal(0);
    // Sólo se devuelve dinero por la parte cobrada al contado de la venta.
    const devoluciones = returns.reduce((acc, r) => {
      if (r.sale.total.lte(0)) return acc;
      const contado = r.sale.payments
        .filter((p) => p.metodo !== PaymentMethod.CREDITO)
        .reduce((sum, p) => sum.plus(p.monto), zero);
      return acc.plus(r.totalDevuelto.times(contado).div(r.sale.total));
    }, zero);

    const ingresosVentas = salePayments._sum.monto ?? zero;
    const comprasDevengadas = purchasesAgg._sum.montoTotal ?? zero;
    const egresosAp = apPayments._sum?.monto ?? zero;
    const ingresosAr = arPayments._sum.monto ?? zero;
    const flujoNeto = ingresosVentas
      .plus(ingresosAr)
      .minus(egresosAp)
      .minus(devoluciones);

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      ingresos: {
        ventas: ingresosVentas.toString(),
        ventasCount: salesCount,
        cobrosClientes: ingresosAr.toString(),
        cobrosCount: arPayments._count,
      },
      egresos: {
        compras: comprasDevengadas.toString(),
        comprasCount: purchasesAgg._count,
        pagosProveedores: egresosAp.toString(),
        pagosProveedoresCount: apPayments._count,
        devoluciones: devoluciones.toDecimalPlaces(2).toString(),
      },
      caja: {
        movimientosTotal: (cashMovements._sum.monto ?? zero).toString(),
        movimientosCount: cashMovements._count,
      },
      flujoNeto: flujoNeto.toDecimalPlaces(2).toString(),
    };
  }

  async getMarginReport(establishmentId: string, query: FinancePeriodQueryDto) {
    const { from, to } = await this.parseRange(establishmentId, query);

    const saleItems = await this.prisma.saleItem.findMany({
      where: {
        sale: {
          establishmentId,
          deletedAt: null,
          // Las ventas con devolución parcial siguen siendo ventas (antes desaparecían).
          estado: {
            in: [SaleStatus.COMPLETADA, SaleStatus.PARCIALMENTE_DEVUELTA],
          },
          createdAt: { gte: from, lt: to },
        },
      },
      select: {
        cantidad: true,
        totalLinea: true,
        id: true,
        lotLines: { select: { codigoLote: true, cantidad: true } },
        sale: { select: { warehouseId: true } },
        product: {
          select: {
            id: true,
            nombre: true,
            costoUnitario: true,
            precioUnitarioCompra: true,
          },
        },
      },
    });

    // Costo histórico: el de los lotes que salieron en la venta (costo de compra del lote);
    // sin lote, el costo del producto. Antes se usaba siempre el costo actual del producto.
    const lotKeys = saleItems.flatMap((item) =>
      item.lotLines.map((l) => ({
        productId: item.product.id,
        warehouseId: item.sale.warehouseId,
        codigoLote: l.codigoLote,
      })),
    );
    const lotCosts = lotKeys.length
      ? await this.prisma.productLotStock.findMany({
          where: { OR: lotKeys },
          select: {
            productId: true,
            warehouseId: true,
            codigoLote: true,
            costoUnitario: true,
          },
        })
      : [];
    const returned = saleItems.length
      ? await this.prisma.saleReturnItem.groupBy({
          by: ['saleItemId'],
          where: { saleItemId: { in: saleItems.map((i) => i.id) } },
          _sum: { cantidad: true },
        })
      : [];
    const returnedBySaleItem = new Map(
      returned.map((r) => [
        r.saleItemId,
        r._sum.cantidad ?? new Prisma.Decimal(0),
      ]),
    );
    const lotCost = new Map(
      lotCosts.map((l) => [
        `${l.productId}|${l.warehouseId}|${l.codigoLote}`,
        l.costoUnitario,
      ]),
    );

    let ventaTotal = new Prisma.Decimal(0);
    let costoTotal = new Prisma.Decimal(0);
    const byProduct = new Map<
      string,
      {
        productId: string;
        nombre: string;
        venta: Prisma.Decimal;
        costo: Prisma.Decimal;
      }
    >();

    for (const item of saleItems) {
      if (item.cantidad.lte(0)) continue;
      // Las recepciones actualizan el precio de compra, no `costoUnitario`: se usa como respaldo.
      const productCost =
        item.product.costoUnitario ??
        item.product.precioUnitarioCompra ??
        new Prisma.Decimal(0);
      const costoBruto = item.lotLines.length
        ? item.lotLines.reduce(
            (acc, l) =>
              acc.plus(
                (
                  lotCost.get(
                    `${item.product.id}|${item.sale.warehouseId}|${l.codigoLote}`,
                  ) ?? productCost
                ).times(l.cantidad),
              ),
            new Prisma.Decimal(0),
          )
        : productCost.times(item.cantidad);
      // Lo devuelto deja de ser venta: se descuenta en proporción de la cantidad.
      const devuelto = returnedBySaleItem.get(item.id) ?? new Prisma.Decimal(0);
      const factor = Prisma.Decimal.max(
        item.cantidad.minus(devuelto).div(item.cantidad),
        0,
      );
      const venta = item.totalLinea.times(factor);
      const costo = costoBruto.times(factor);
      ventaTotal = ventaTotal.plus(venta);
      costoTotal = costoTotal.plus(costo);

      const prev = byProduct.get(item.product.id) ?? {
        productId: item.product.id,
        nombre: item.product.nombre,
        venta: new Prisma.Decimal(0),
        costo: new Prisma.Decimal(0),
      };
      prev.venta = prev.venta.plus(venta);
      prev.costo = prev.costo.plus(costo);
      byProduct.set(item.product.id, prev);
    }

    const margen = ventaTotal.minus(costoTotal);

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      ventaTotal: ventaTotal.toString(),
      costoTotal: costoTotal.toString(),
      margen: margen.toString(),
      margenPorcentaje: ventaTotal.greaterThan(0)
        ? margen.div(ventaTotal).times(100).toFixed(2)
        : '0',
      topProducts: [...byProduct.values()]
        .map((p) => ({
          productId: p.productId,
          nombre: p.nombre,
          venta: p.venta.toString(),
          costo: p.costo.toString(),
          margen: p.venta.minus(p.costo).toString(),
        }))
        .sort(
          (a, b) => Number.parseFloat(b.margen) - Number.parseFloat(a.margen),
        )
        .slice(0, 20),
    };
  }

  async exportAccounting(
    establishmentId: string,
    query: AccountingExportQueryDto,
  ) {
    const { from, to, timeZone } = await this.parseRange(
      establishmentId,
      query,
    );

    const sales = await this.prisma.sale.findMany({
      where: {
        establishmentId,
        deletedAt: null,
        estado: { in: ['COMPLETADA', 'PARCIALMENTE_DEVUELTA'] },
        createdAt: { gte: from, lt: to },
      },
      select: {
        createdAt: true,
        serie: true,
        numero: true,
        documentType: true,
        subtotal: true,
        igvTotal: true,
        total: true,
        customer: { select: { numeroDocumento: true, nombre: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const purchases = await this.prisma.accountPayable.findMany({
      where: {
        establishmentId,
        deletedAt: null,
        fechaEmision: { gte: from, lt: to },
      },
      select: {
        fechaEmision: true,
        numeroDocumento: true,
        montoTotal: true,
        supplier: { select: { numeroDocumento: true, razonSocial: true } },
      },
      orderBy: { fechaEmision: 'asc' },
    });

    const lines: string[] = [];
    if (query.format === 'contasis') {
      lines.push('TIPO;FECHA;SERIE;NUMERO;RUC;CLIENTE;BASE;IGV;TOTAL');
      for (const s of sales) {
        lines.push(
          [
            'VENTA',
            formatDateYmdInTimeZone(s.createdAt, timeZone),
            s.serie ?? '',
            s.numero ?? '',
            s.customer?.numeroDocumento ?? '',
            (s.customer?.nombre ?? '').replace(/;/g, ','),
            s.subtotal.toString(),
            s.igvTotal.toString(),
            s.total.toString(),
          ].join(';'),
        );
      }
      for (const p of purchases) {
        lines.push(
          [
            'COMPRA',
            formatDateYmdInTimeZone(p.fechaEmision, timeZone),
            '',
            p.numeroDocumento ?? '',
            p.supplier?.numeroDocumento ?? '',
            (p.supplier?.razonSocial ?? '').replace(/;/g, ','),
            p.montoTotal.toString(),
            '0',
            p.montoTotal.toString(),
          ].join(';'),
        );
      }
    } else if (query.format === 'siscont') {
      lines.push('ORIGEN|FECHA|DOC|TERCERO|SUBTOTAL|IGV|TOTAL');
      for (const s of sales) {
        lines.push(
          [
            'V',
            formatDateYmdInTimeZone(s.createdAt, timeZone),
            `${s.serie ?? ''}-${s.numero ?? ''}`,
            s.customer?.numeroDocumento ?? '',
            s.subtotal.toString(),
            s.igvTotal.toString(),
            s.total.toString(),
          ].join('|'),
        );
      }
      for (const p of purchases) {
        lines.push(
          [
            'C',
            formatDateYmdInTimeZone(p.fechaEmision, timeZone),
            p.numeroDocumento ?? '',
            p.supplier?.numeroDocumento ?? '',
            p.montoTotal.toString(),
            '0',
            p.montoTotal.toString(),
          ].join('|'),
        );
      }
    } else {
      lines.push('tipo,fecha,documento,tercero,subtotal,igv,total');
      for (const s of sales) {
        lines.push(
          [
            'VENTA',
            formatDateYmdInTimeZone(s.createdAt, timeZone),
            `${s.serie ?? ''}-${s.numero ?? ''}`,
            s.customer?.numeroDocumento ?? '',
            s.subtotal.toString(),
            s.igvTotal.toString(),
            s.total.toString(),
          ].join(','),
        );
      }
      for (const p of purchases) {
        lines.push(
          [
            'COMPRA',
            formatDateYmdInTimeZone(p.fechaEmision, timeZone),
            p.numeroDocumento ?? '',
            p.supplier?.numeroDocumento ?? '',
            p.montoTotal.toString(),
            '0',
            p.montoTotal.toString(),
          ].join(','),
        );
      }
    }

    const ext = query.format === 'excel' ? 'csv' : query.format;
    return {
      filename: `contable-${query.format}-${query.from}-${query.to}.${ext}`,
      content: lines.join('\n'),
      mimeType: 'text/csv; charset=utf-8',
    };
  }

  async listBankAccounts(establishmentId: string) {
    const rows = await this.prisma.bankAccount.findMany({
      where: { establishmentId, deletedAt: null },
      orderBy: { nombre: 'asc' },
    });
    return rows.map((r) => ({
      ...r,
      saldoLibro: r.saldoLibro.toString(),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  async createBankAccount(
    establishmentId: string,
    dto: CreateBankAccountDto,
    userId: string,
  ) {
    const row = await this.prisma.bankAccount.create({
      data: {
        establishmentId,
        nombre: dto.nombre.trim(),
        tipo: dto.tipo ?? 'BANCO',
        banco: dto.banco?.trim() || null,
        numeroCuenta: dto.numeroCuenta?.trim() || null,
      },
    });
    await this.audit.log({
      userId,
      action: 'CREATE',
      entity: 'BankAccount',
      entityId: row.id,
    });
    return { ...row, saldoLibro: row.saldoLibro.toString() };
  }

  async listBankMovements(
    establishmentId: string,
    query: BankMovementListQueryDto,
  ) {
    const { page, pageSize, skip, take } = paginationArgs(query);
    const where: Prisma.BankMovementWhereInput = {
      bankAccount: { establishmentId, deletedAt: null },
      ...(query.bankAccountId ? { bankAccountId: query.bankAccountId } : {}),
      ...(query.conciliado !== undefined
        ? { conciliado: query.conciliado }
        : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.bankMovement.count({ where }),
      this.prisma.bankMovement.findMany({
        where,
        skip,
        take,
        orderBy: { movimientoAt: 'desc' },
        include: {
          bankAccount: { select: { id: true, nombre: true } },
        },
      }),
    ]);
    return buildPaginatedResult(
      rows.map((r) => ({
        id: r.id,
        bankAccountId: r.bankAccountId,
        bankAccount: r.bankAccount,
        tipo: r.tipo,
        monto: r.monto.toString(),
        referencia: r.referencia,
        descripcion: r.descripcion,
        conciliado: r.conciliado,
        conciliadoAt: r.conciliadoAt?.toISOString() ?? null,
        movimientoAt: r.movimientoAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    );
  }

  async createBankMovement(
    establishmentId: string,
    dto: CreateBankMovementDto,
    userId: string,
  ) {
    const account = await this.prisma.bankAccount.findFirst({
      where: { id: dto.bankAccountId, establishmentId, deletedAt: null },
    });
    if (!account) throw new NotFoundException('Cuenta bancaria no encontrada');

    const monto = new Prisma.Decimal(dto.monto);
    const delta =
      dto.tipo === BankMovementType.INGRESO ? monto : monto.negated();

    const movement = await this.prisma.$transaction(async (tx) => {
      const mov = await tx.bankMovement.create({
        data: {
          bankAccountId: dto.bankAccountId,
          tipo: dto.tipo,
          monto,
          referencia: dto.referencia?.trim() || null,
          descripcion: dto.descripcion?.trim() || null,
          createdById: userId,
        },
      });
      await tx.bankAccount.update({
        where: { id: dto.bankAccountId },
        data: { saldoLibro: account.saldoLibro.plus(delta) },
      });
      return mov;
    });

    await this.audit.log({
      userId,
      action: 'CREATE',
      entity: 'BankMovement',
      entityId: movement.id,
    });
    return { id: movement.id, monto: movement.monto.toString() };
  }

  async reconcileMovements(
    establishmentId: string,
    movementIds: string[],
    userId: string,
  ) {
    const movements = await this.prisma.bankMovement.findMany({
      where: {
        id: { in: movementIds },
        bankAccount: { establishmentId },
        conciliado: false,
      },
      select: { id: true },
    });
    if (movements.length === 0)
      throw new BadRequestException('Sin movimientos para conciliar');

    await this.prisma.bankMovement.updateMany({
      where: { id: { in: movements.map((m) => m.id) } },
      data: { conciliado: true, conciliadoAt: new Date() },
    });

    await this.audit.log({
      userId,
      action: 'RECONCILE',
      entity: 'BankMovement',
      entityId: movements.map((m) => m.id).join(','),
    });

    return { ok: true, reconciled: movements.length };
  }

  async upsertPurchaseBudget(
    establishmentId: string,
    dto: UpsertPurchaseBudgetDto,
    userId: string,
  ) {
    const row = await this.prisma.purchaseBudget.upsert({
      where: {
        establishmentId_anio_mes: {
          establishmentId,
          anio: dto.anio,
          mes: dto.mes,
        },
      },
      create: {
        establishmentId,
        anio: dto.anio,
        mes: dto.mes,
        montoPresupuestado: new Prisma.Decimal(dto.montoPresupuestado),
        notas: dto.notas?.trim() || null,
      },
      update: {
        montoPresupuestado: new Prisma.Decimal(dto.montoPresupuestado),
        notas: dto.notas?.trim() || null,
      },
    });
    await this.audit.log({
      userId,
      action: 'UPSERT',
      entity: 'PurchaseBudget',
      entityId: row.id,
    });
    return {
      id: row.id,
      anio: row.anio,
      mes: row.mes,
      montoPresupuestado: row.montoPresupuestado.toString(),
    };
  }

  async getPurchaseBudgetVsActual(
    establishmentId: string,
    query: PurchaseBudgetReportQueryDto,
  ) {
    const budgets = await this.prisma.purchaseBudget.findMany({
      where: { establishmentId, anio: query.anio },
      orderBy: { mes: 'asc' },
    });
    const tz = await this.resolveTimeZone(establishmentId);

    const rows = await Promise.all(
      budgets.map(async (b) => {
        const yearMonth = `${query.anio}-${String(b.mes).padStart(2, '0')}`;
        const { start: from, end: to } = monthBoundsInTimeZone(yearMonth, tz);
        const actual = await this.prisma.accountPayable.aggregate({
          where: {
            establishmentId,
            deletedAt: null,
            fechaEmision: { gte: from, lt: to },
          },
          _sum: { montoTotal: true },
        });
        const actualTotal = actual._sum.montoTotal ?? new Prisma.Decimal(0);
        const presupuesto = b.montoPresupuestado;
        const variacion = actualTotal.minus(presupuesto);
        return {
          mes: b.mes,
          presupuesto: presupuesto.toString(),
          actual: actualTotal.toString(),
          variacion: variacion.toString(),
          variacionPorcentaje: presupuesto.greaterThan(0)
            ? variacion.div(presupuesto).times(100).toFixed(2)
            : '0',
        };
      }),
    );

    return { anio: query.anio, months: rows };
  }

  async getPaymentsByMethod(
    establishmentId: string,
    query: FinancePeriodQueryDto,
  ) {
    const { from, to } = await this.parseRange(establishmentId, query);

    const salePayments = await this.prisma.payment.findMany({
      where: {
        sale: {
          establishmentId,
          deletedAt: null,
          estado: { in: ['COMPLETADA', 'PARCIALMENTE_DEVUELTA'] },
          createdAt: { gte: from, lt: to },
        },
      },
      select: { metodo: true, monto: true },
    });

    const arPayments = await this.prisma.accountReceivablePayment.findMany({
      where: {
        pagadoAt: { gte: from, lt: to },
        accountReceivable: { establishmentId, deletedAt: null },
      },
      select: { metodoPago: true, monto: true },
    });

    const apPayments = await this.prisma.accountPayablePayment.findMany({
      where: {
        fechaPago: { gte: from, lt: to },
        accountPayable: { establishmentId, deletedAt: null },
      },
      select: { metodo: true, monto: true },
    });

    const cashMovements = await this.prisma.cashMovement.findMany({
      where: {
        createdAt: { gte: from, lt: to },
        cashSession: { cashRegister: { establishmentId } },
      },
      select: { tipo: true, metodoPago: true, monto: true },
    });

    type Bucket = {
      ingresos: Prisma.Decimal;
      egresos: Prisma.Decimal;
      count: number;
    };
    const byMethod = new Map<string, Bucket>();

    const add = (
      metodo: string | null | undefined,
      ingreso: Prisma.Decimal,
      egreso: Prisma.Decimal,
    ) => {
      const key = metodo?.trim() || 'SIN_ESPECIFICAR';
      const prev = byMethod.get(key) ?? {
        ingresos: new Prisma.Decimal(0),
        egresos: new Prisma.Decimal(0),
        count: 0,
      };
      prev.ingresos = prev.ingresos.plus(ingreso);
      prev.egresos = prev.egresos.plus(egreso);
      prev.count += 1;
      byMethod.set(key, prev);
    };

    for (const p of salePayments) add(p.metodo, p.monto, new Prisma.Decimal(0));
    for (const p of arPayments)
      add(p.metodoPago, p.monto, new Prisma.Decimal(0));
    for (const p of apPayments) add(p.metodo, new Prisma.Decimal(0), p.monto);
    for (const m of cashMovements) {
      const metodo = m.metodoPago ?? 'EFECTIVO';
      if (m.monto.greaterThanOrEqualTo(0))
        add(metodo, m.monto, new Prisma.Decimal(0));
      else add(metodo, new Prisma.Decimal(0), m.monto.abs());
    }

    const methods = [...byMethod.entries()]
      .map(([metodo, bucket]) => ({
        metodo,
        ingresos: bucket.ingresos.toString(),
        egresos: bucket.egresos.toString(),
        neto: bucket.ingresos.minus(bucket.egresos).toString(),
        transacciones: bucket.count,
      }))
      .sort((a, b) => Number.parseFloat(b.neto) - Number.parseFloat(a.neto));

    const totalIngresos = methods.reduce(
      (acc, row) => acc.plus(new Prisma.Decimal(row.ingresos)),
      new Prisma.Decimal(0),
    );
    const totalEgresos = methods.reduce(
      (acc, row) => acc.plus(new Prisma.Decimal(row.egresos)),
      new Prisma.Decimal(0),
    );

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      totalIngresos: totalIngresos.toString(),
      totalEgresos: totalEgresos.toString(),
      neto: totalIngresos.minus(totalEgresos).toString(),
      methods,
    };
  }

  async getRecentPayments(
    establishmentId: string,
    query: RecentPaymentsQueryDto,
  ) {
    const { page, pageSize, skip, take } = paginationArgs(query);
    let dateFilter: { gte?: Date; lt?: Date } | undefined;
    if (query.from || query.to) {
      const tz = await this.resolveTimeZone(establishmentId);
      const fromYmd = query.from?.trim();
      const toYmd = query.to?.trim();
      if (fromYmd && toYmd) {
        const { start, end } = dateRangeBoundsInTimeZone(fromYmd, toYmd, tz);
        dateFilter = { gte: start, lt: end };
      } else if (fromYmd) {
        const { start } = dateRangeBoundsInTimeZone(fromYmd, fromYmd, tz);
        dateFilter = { gte: start };
      } else if (toYmd) {
        const { end } = dateRangeBoundsInTimeZone(toYmd, toYmd, tz);
        dateFilter = { lt: end };
      }
    }

    type Entry = {
      id: string;
      fecha: Date;
      tipo: string;
      monto: Prisma.Decimal;
      metodo: string;
      referencia: string | null;
      descripcion: string;
    };

    const entries: Entry[] = [];

    const salePayments = await this.prisma.payment.findMany({
      where: {
        sale: {
          establishmentId,
          deletedAt: null,
          estado: { in: ['COMPLETADA', 'PARCIALMENTE_DEVUELTA'] },
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
      },
      take: 500,
      orderBy: { sale: { createdAt: 'desc' } },
      select: {
        id: true,
        metodo: true,
        monto: true,
        referencia: true,
        sale: {
          select: {
            createdAt: true,
            serie: true,
            numero: true,
            documentType: true,
          },
        },
      },
    });

    for (const p of salePayments) {
      entries.push({
        id: p.id,
        fecha: p.sale.createdAt,
        tipo: 'VENTA',
        monto: p.monto,
        metodo: p.metodo,
        referencia: p.referencia,
        descripcion:
          `${p.sale.documentType} ${p.sale.serie ?? ''}-${p.sale.numero ?? ''}`.trim(),
      });
    }

    const arPayments = await this.prisma.accountReceivablePayment.findMany({
      where: {
        accountReceivable: { establishmentId, deletedAt: null },
        ...(dateFilter ? { pagadoAt: dateFilter } : {}),
      },
      take: 200,
      orderBy: { pagadoAt: 'desc' },
      select: {
        id: true,
        monto: true,
        metodoPago: true,
        referencia: true,
        pagadoAt: true,
        accountReceivable: { select: { documentoRef: true } },
      },
    });

    for (const p of arPayments) {
      entries.push({
        id: p.id,
        fecha: p.pagadoAt,
        tipo: 'COBRO_CLIENTE',
        monto: p.monto,
        metodo: p.metodoPago ?? 'SIN_ESPECIFICAR',
        referencia: p.referencia,
        descripcion: `CxC ${p.accountReceivable.documentoRef ?? ''}`.trim(),
      });
    }

    const apPayments = await this.prisma.accountPayablePayment.findMany({
      where: {
        accountPayable: { establishmentId, deletedAt: null },
        ...(dateFilter ? { fechaPago: dateFilter } : {}),
      },
      take: 200,
      orderBy: { fechaPago: 'desc' },
      select: {
        id: true,
        monto: true,
        metodo: true,
        referencia: true,
        fechaPago: true,
        accountPayable: { select: { numeroDocumento: true } },
      },
    });

    for (const p of apPayments) {
      entries.push({
        id: p.id,
        fecha: p.fechaPago,
        tipo: 'PAGO_PROVEEDOR',
        monto: p.monto,
        metodo: p.metodo ?? 'SIN_ESPECIFICAR',
        referencia: p.referencia,
        descripcion: `CxP ${p.accountPayable.numeroDocumento ?? ''}`.trim(),
      });
    }

    entries.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
    const total = entries.length;
    const items = entries.slice(skip, skip + take).map((e) => ({
      id: e.id,
      fecha: e.fecha.toISOString(),
      tipo: e.tipo,
      monto: e.monto.toString(),
      metodo: e.metodo,
      referencia: e.referencia,
      descripcion: e.descripcion,
    }));

    return buildPaginatedResult(items, total, page, pageSize);
  }

  async getGeneralLedger(
    establishmentId: string,
    query: GeneralLedgerQueryDto,
  ) {
    const { from, to } = await this.parseRange(establishmentId, query);
    const { page, pageSize, skip, take } = paginationArgs(query);

    type LedgerRow = {
      id: string;
      fecha: Date;
      cuenta: string;
      descripcion: string;
      debe: Prisma.Decimal;
      haber: Prisma.Decimal;
      origen: string;
    };

    const rows: LedgerRow[] = [];

    const sales = await this.prisma.sale.findMany({
      where: {
        establishmentId,
        deletedAt: null,
        estado: { in: ['COMPLETADA', 'PARCIALMENTE_DEVUELTA'] },
        createdAt: { gte: from, lt: to },
      },
      select: {
        id: true,
        createdAt: true,
        serie: true,
        numero: true,
        documentType: true,
        total: true,
      },
    });

    for (const s of sales) {
      rows.push({
        id: `sale-${s.id}`,
        fecha: s.createdAt,
        cuenta: '70111',
        descripcion:
          `Venta ${s.documentType} ${s.serie ?? ''}-${s.numero ?? ''}`.trim(),
        debe: new Prisma.Decimal(0),
        haber: s.total,
        origen: 'VENTA',
      });
    }

    const payables = await this.prisma.accountPayable.findMany({
      where: {
        establishmentId,
        deletedAt: null,
        fechaEmision: { gte: from, lt: to },
      },
      select: {
        id: true,
        fechaEmision: true,
        numeroDocumento: true,
        montoTotal: true,
        supplier: { select: { razonSocial: true } },
      },
    });

    for (const p of payables) {
      rows.push({
        id: `ap-${p.id}`,
        fecha: p.fechaEmision,
        cuenta: '60111',
        descripcion:
          `Compra ${p.numeroDocumento ?? ''} · ${p.supplier?.razonSocial ?? ''}`.trim(),
        debe: p.montoTotal,
        haber: new Prisma.Decimal(0),
        origen: 'COMPRA',
      });
    }

    const bankMovements = await this.prisma.bankMovement.findMany({
      where: {
        movimientoAt: { gte: from, lt: to },
        bankAccount: { establishmentId, deletedAt: null },
      },
      select: {
        id: true,
        movimientoAt: true,
        tipo: true,
        monto: true,
        descripcion: true,
        referencia: true,
        bankAccount: { select: { nombre: true } },
      },
    });

    for (const m of bankMovements) {
      const isIngreso = m.tipo === BankMovementType.INGRESO;
      rows.push({
        id: `bank-${m.id}`,
        fecha: m.movimientoAt,
        cuenta: '10411',
        descripcion:
          `${m.bankAccount.nombre} · ${m.descripcion ?? m.referencia ?? m.tipo}`.trim(),
        debe: isIngreso ? m.monto : new Prisma.Decimal(0),
        haber: isIngreso ? new Prisma.Decimal(0) : m.monto,
        origen: 'BANCO',
      });
    }

    rows.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
    const total = rows.length;
    const items = rows.slice(skip, skip + take).map((r) => ({
      id: r.id,
      fecha: r.fecha.toISOString(),
      cuenta: r.cuenta,
      descripcion: r.descripcion,
      debe: r.debe.toString(),
      haber: r.haber.toString(),
      origen: r.origen,
    }));

    const totalDebe = rows.reduce(
      (acc, r) => acc.plus(r.debe),
      new Prisma.Decimal(0),
    );
    const totalHaber = rows.reduce(
      (acc, r) => acc.plus(r.haber),
      new Prisma.Decimal(0),
    );

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      totalDebe: totalDebe.toString(),
      totalHaber: totalHaber.toString(),
      ...buildPaginatedResult(items, total, page, pageSize),
    };
  }

  private async resolveTimeZone(establishmentId: string): Promise<string> {
    const row = await this.prisma.establishment.findFirst({
      where: { id: establishmentId, deletedAt: null },
      select: { timeZone: true },
    });
    return normalizeTimeZone(row?.timeZone);
  }

  private async parseRange(
    establishmentId: string,
    query: FinancePeriodQueryDto,
  ) {
    const fromYmd = query.from?.trim();
    const toYmd = query.to?.trim();
    if (
      !fromYmd ||
      !toYmd ||
      !/^\d{4}-\d{2}-\d{2}$/.test(fromYmd) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(toYmd)
    ) {
      throw new BadRequestException('Rango de fechas inválido');
    }
    const tz = await this.resolveTimeZone(establishmentId);
    const { start, end } = dateRangeBoundsInTimeZone(fromYmd, toYmd, tz);
    return { from: start, to: end, timeZone: tz };
  }
}
