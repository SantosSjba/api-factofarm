import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BankMovementType, Prisma } from '../../generated/prisma/client';
import { buildPaginatedResult, paginationArgs } from '../../common/dto/pagination.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AccountingExportQueryDto,
  BankMovementListQueryDto,
  CreateBankAccountDto,
  CreateBankMovementDto,
  FinancePeriodQueryDto,
  PurchaseBudgetReportQueryDto,
  UpsertPurchaseBudgetDto,
} from './dto/finance.dto';

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  async getCashFlow(establishmentId: string, query: FinancePeriodQueryDto) {
    const { from, to } = this.parseRange(query);

    const salesAgg = await this.prisma.sale.aggregate({
      where: {
        establishmentId,
        deletedAt: null,
        estado: 'COMPLETADA',
        createdAt: { gte: from, lte: to },
      },
      _sum: { total: true },
      _count: true,
    });

    const purchasesAgg = await this.prisma.accountPayable.aggregate({
      where: {
        establishmentId,
        deletedAt: null,
        fechaEmision: { gte: from, lte: to },
      },
      _sum: { montoTotal: true },
      _count: true,
    });

    const apPayments = await this.prisma.accountPayablePayment.aggregate({
      where: {
        fechaPago: { gte: from, lte: to },
        accountPayable: { establishmentId, deletedAt: null },
      },
      _sum: { monto: true },
      _count: true,
    });

    const arPayments = await this.prisma.accountReceivablePayment.aggregate({
      where: {
        pagadoAt: { gte: from, lte: to },
        accountReceivable: { establishmentId, deletedAt: null },
      },
      _sum: { monto: true },
      _count: true,
    });

    const cashMovements = await this.prisma.cashMovement.aggregate({
      where: {
        createdAt: { gte: from, lte: to },
        cashSession: { cashRegister: { establishmentId } },
      },
      _sum: { monto: true },
      _count: true,
    });

    const ingresosVentas = salesAgg._sum.total ?? new Prisma.Decimal(0);
    const egresosCompras = purchasesAgg._sum.montoTotal ?? new Prisma.Decimal(0);
    const egresosAp = apPayments._sum?.monto ?? new Prisma.Decimal(0);
    const ingresosAr = arPayments._sum.monto ?? new Prisma.Decimal(0);
    const flujoNeto = ingresosVentas
      .plus(ingresosAr)
      .minus(egresosCompras)
      .minus(egresosAp);

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      ingresos: {
        ventas: ingresosVentas.toString(),
        ventasCount: salesAgg._count,
        cobrosClientes: ingresosAr.toString(),
        cobrosCount: arPayments._count,
      },
      egresos: {
        compras: egresosCompras.toString(),
        comprasCount: purchasesAgg._count,
        pagosProveedores: egresosAp.toString(),
        pagosProveedoresCount: apPayments._count,
      },
      caja: {
        movimientosTotal: (cashMovements._sum.monto ?? new Prisma.Decimal(0)).toString(),
        movimientosCount: cashMovements._count,
      },
      flujoNeto: flujoNeto.toString(),
    };
  }

  async getMarginReport(establishmentId: string, query: FinancePeriodQueryDto) {
    const { from, to } = this.parseRange(query);

    const saleItems = await this.prisma.saleItem.findMany({
      where: {
        sale: {
          establishmentId,
          deletedAt: null,
          estado: 'COMPLETADA',
          createdAt: { gte: from, lte: to },
        },
      },
      select: {
        cantidad: true,
        totalLinea: true,
        product: { select: { id: true, nombre: true, costoUnitario: true } },
      },
    });

    let ventaTotal = new Prisma.Decimal(0);
    let costoTotal = new Prisma.Decimal(0);
    const byProduct = new Map<
      string,
      { productId: string; nombre: string; venta: Prisma.Decimal; costo: Prisma.Decimal }
    >();

    for (const item of saleItems) {
      const venta = item.totalLinea;
      const costoUnit = item.product.costoUnitario ?? new Prisma.Decimal(0);
      const costo = costoUnit.times(item.cantidad);
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
        .sort((a, b) => Number.parseFloat(b.margen) - Number.parseFloat(a.margen))
        .slice(0, 20),
    };
  }

  async exportAccounting(establishmentId: string, query: AccountingExportQueryDto) {
    const { from, to } = this.parseRange(query);

    const sales = await this.prisma.sale.findMany({
      where: {
        establishmentId,
        deletedAt: null,
        estado: 'COMPLETADA',
        createdAt: { gte: from, lte: to },
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
        fechaEmision: { gte: from, lte: to },
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
            s.createdAt.toISOString().slice(0, 10),
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
            p.fechaEmision.toISOString().slice(0, 10),
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
            s.createdAt.toISOString().slice(0, 10),
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
            p.fechaEmision.toISOString().slice(0, 10),
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
            s.createdAt.toISOString().slice(0, 10),
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
            p.fechaEmision.toISOString().slice(0, 10),
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
      filename: `contable-${query.format}-${from.toISOString().slice(0, 10)}-${to.toISOString().slice(0, 10)}.${ext}`,
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

  async createBankAccount(establishmentId: string, dto: CreateBankAccountDto, userId: string) {
    const row = await this.prisma.bankAccount.create({
      data: {
        establishmentId,
        nombre: dto.nombre.trim(),
        tipo: dto.tipo ?? 'BANCO',
        banco: dto.banco?.trim() || null,
        numeroCuenta: dto.numeroCuenta?.trim() || null,
      },
    });
    await this.audit.log({ userId, action: 'CREATE', entity: 'BankAccount', entityId: row.id });
    return { ...row, saldoLibro: row.saldoLibro.toString() };
  }

  async listBankMovements(establishmentId: string, query: BankMovementListQueryDto) {
    const { page, pageSize, skip, take } = paginationArgs(query);
    const where: Prisma.BankMovementWhereInput = {
      bankAccount: { establishmentId, deletedAt: null },
      ...(query.bankAccountId ? { bankAccountId: query.bankAccountId } : {}),
      ...(query.conciliado !== undefined ? { conciliado: query.conciliado } : {}),
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

  async createBankMovement(establishmentId: string, dto: CreateBankMovementDto, userId: string) {
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

    await this.audit.log({ userId, action: 'CREATE', entity: 'BankMovement', entityId: movement.id });
    return { id: movement.id, monto: movement.monto.toString() };
  }

  async reconcileMovements(establishmentId: string, movementIds: string[], userId: string) {
    const movements = await this.prisma.bankMovement.findMany({
      where: {
        id: { in: movementIds },
        bankAccount: { establishmentId },
        conciliado: false,
      },
      select: { id: true },
    });
    if (movements.length === 0) throw new BadRequestException('Sin movimientos para conciliar');

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

  async upsertPurchaseBudget(establishmentId: string, dto: UpsertPurchaseBudgetDto, userId: string) {
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
    await this.audit.log({ userId, action: 'UPSERT', entity: 'PurchaseBudget', entityId: row.id });
    return {
      id: row.id,
      anio: row.anio,
      mes: row.mes,
      montoPresupuestado: row.montoPresupuestado.toString(),
    };
  }

  async getPurchaseBudgetVsActual(establishmentId: string, query: PurchaseBudgetReportQueryDto) {
    const budgets = await this.prisma.purchaseBudget.findMany({
      where: { establishmentId, anio: query.anio },
      orderBy: { mes: 'asc' },
    });

    const rows = await Promise.all(
      budgets.map(async (b) => {
        const from = new Date(query.anio, b.mes - 1, 1);
        const to = new Date(query.anio, b.mes, 0, 23, 59, 59, 999);
        const actual = await this.prisma.accountPayable.aggregate({
          where: {
            establishmentId,
            deletedAt: null,
            fechaEmision: { gte: from, lte: to },
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

  private parseRange(query: FinancePeriodQueryDto) {
    const from = new Date(query.from);
    const to = new Date(query.to);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new BadRequestException('Rango de fechas inválido');
    }
    return { from, to };
  }
}
