import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  formatDateYmdInTimeZone,
  monthBoundsInTimeZone,
  normalizeTimeZone,
} from '../../../common/utils/timezone.util';

type PleBook = '14.1' | '8.1' | '13.1';

@Injectable()
export class PleService {
  constructor(private readonly prisma: PrismaService) {}

  async buildTxt(establishmentId: string, period: string, book: PleBook) {
    const tz = await this.resolveTimeZone(establishmentId);
    const { start: from, end: to } = monthBoundsInTimeZone(period, tz);

    if (book === '14.1') {
      return this.buildSalesBook(establishmentId, from, to, period, book, tz);
    }
    if (book === '8.1') {
      return this.buildPurchasesBook(establishmentId, from, to, period, book, tz);
    }
    return this.buildInventoryBook(establishmentId, from, to, period, book, tz);
  }

  async accountantSummary(establishmentId: string, period: string) {
    const tz = await this.resolveTimeZone(establishmentId);
    const { start: from, end: to } = monthBoundsInTimeZone(period, tz);

    const sales = await this.prisma.sale.aggregate({
      where: {
        establishmentId,
        deletedAt: null,
        estado: 'COMPLETADA',
        createdAt: { gte: from, lt: to },
      },
      _sum: { subtotal: true, igvTotal: true, total: true },
      _count: true,
    });

    const purchases = await this.prisma.goodsReceipt.findMany({
      where: {
        establishmentId,
        deletedAt: null,
        createdAt: { gte: from, lt: to },
      },
      include: {
        purchaseOrder: {
          select: {
            supplier: { select: { razonSocial: true, numeroDocumento: true } },
            total: true,
          },
        },
      },
    });

    const purchasesTotal = purchases.reduce(
      (acc, row) => acc.plus(row.purchaseOrder?.total ?? new Prisma.Decimal(0)),
      new Prisma.Decimal(0),
    );

    const electronic = await this.prisma.electronicDocument.groupBy({
      by: ['documentType'],
      where: {
        establishmentId,
        deletedAt: null,
        createdAt: { gte: from, lt: to },
      },
      _count: true,
      _sum: { total: true },
    });

    return {
      period,
      ventas: {
        count: sales._count,
        subtotal: sales._sum.subtotal?.toString() ?? '0',
        igv: sales._sum.igvTotal?.toString() ?? '0',
        total: sales._sum.total?.toString() ?? '0',
      },
      compras: {
        count: purchases.length,
        total: purchasesTotal.toString(),
      },
      comprobantesElectronicos: electronic.map((row) => ({
        tipo: row.documentType,
        count: row._count,
        total: row._sum.total?.toString() ?? '0',
      })),
    };
  }

  private async buildSalesBook(
    establishmentId: string,
    from: Date,
    to: Date,
    period: string,
    book: PleBook,
  timeZone: string,
  ) {
    const config = await this.prisma.establishmentBillingConfig.findUnique({
      where: { establishmentId },
      select: { rucEmisor: true },
    });
    const ruc = config?.rucEmisor ?? '00000000000';

    const sales = await this.prisma.sale.findMany({
      where: {
        establishmentId,
        deletedAt: null,
        estado: 'COMPLETADA',
        createdAt: { gte: from, lt: to },
      },
      include: {
        customer: { select: { tipoDocumento: true, numeroDocumento: true, nombre: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const header = [
      'LIBRO',
      'PERIODO',
      'RUC',
      'TIPO_DOC',
      'SERIE',
      'NUMERO',
      'FECHA',
      'CLIENTE_DOC',
      'CLIENTE_NOMBRE',
      'SUBTOTAL',
      'IGV',
      'TOTAL',
    ].join('|');

    const lines = sales.map((sale, idx) =>
      [
        book,
        period,
        ruc,
        sale.documentType,
        sale.serie ?? '',
        sale.numero ?? '',
        formatDateYmdInTimeZone(sale.createdAt, timeZone),
        sale.customer?.numeroDocumento ?? '',
        sale.customer?.nombre ?? 'CLIENTE VARIOS',
        sale.subtotal.toString(),
        sale.igvTotal.toString(),
        sale.total.toString(),
        String(idx + 1),
      ].join('|'),
    );

    return {
      filename: `LE${ruc}${yearMonthFile(period)}${book.replace('.', '')}.txt`,
      content: [header, ...lines].join('\n'),
      rowCount: lines.length,
    };
  }

  private async buildPurchasesBook(
    establishmentId: string,
    from: Date,
    to: Date,
    period: string,
    book: PleBook,
  timeZone: string,
  ) {
    const config = await this.prisma.establishmentBillingConfig.findUnique({
      where: { establishmentId },
      select: { rucEmisor: true },
    });
    const ruc = config?.rucEmisor ?? '00000000000';

    const receipts = await this.prisma.goodsReceipt.findMany({
      where: {
        establishmentId,
        deletedAt: null,
        createdAt: { gte: from, lt: to },
      },
      include: {
        purchaseOrder: {
          select: {
            total: true,
            supplier: { select: { razonSocial: true, numeroDocumento: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const header = [
      'LIBRO',
      'PERIODO',
      'RUC',
      'PROVEEDOR_DOC',
      'PROVEEDOR_NOMBRE',
      'FECHA',
      'TOTAL',
      'REFERENCIA',
    ].join('|');

    const lines = receipts.map((row, idx) =>
      [
        book,
        period,
        ruc,
        row.purchaseOrder?.supplier?.numeroDocumento ?? '',
        row.purchaseOrder?.supplier?.razonSocial ?? '',
        formatDateYmdInTimeZone(row.createdAt, timeZone),
        row.purchaseOrder?.total?.toString() ?? '0',
        row.numero ?? row.id.slice(0, 8),
        String(idx + 1),
      ].join('|'),
    );

    return {
      filename: `LE${ruc}${yearMonthFile(period)}${book.replace('.', '')}.txt`,
      content: [header, ...lines].join('\n'),
      rowCount: lines.length,
    };
  }

  private async buildInventoryBook(
    establishmentId: string,
    from: Date,
    to: Date,
    period: string,
    book: PleBook,
  timeZone: string,
  ) {
    const config = await this.prisma.establishmentBillingConfig.findUnique({
      where: { establishmentId },
      select: { rucEmisor: true },
    });
    const ruc = config?.rucEmisor ?? '00000000000';

    const stocks = await this.prisma.productLotStock.findMany({
      where: {
        warehouse: { establishmentId, deletedAt: null },
        deletedAt: null,
        stock: { gt: 0 },
      },
      include: {
        product: { select: { nombre: true, codigoInterno: true, codigoSunat: true } },
        warehouse: { select: { nombre: true } },
      },
      take: 5000,
    });

    const header = [
      'LIBRO',
      'PERIODO',
      'RUC',
      'PRODUCTO',
      'CODIGO',
      'LOTE',
      'ALMACEN',
      'STOCK',
      'COSTO',
      'VENCIMIENTO',
    ].join('|');

    const lines = stocks.map((row, idx) =>
      [
        book,
        period,
        ruc,
        row.product.nombre,
        row.product.codigoInterno ?? row.product.codigoSunat ?? '',
        row.codigoLote,
        row.warehouse.nombre,
        row.stock.toString(),
        row.costoUnitario?.toString() ?? '0',
        row.fechaVencimiento
          ? formatDateYmdInTimeZone(row.fechaVencimiento, timeZone)
          : '',
        String(idx + 1),
      ].join('|'),
    );

    return {
      filename: `LE${ruc}${yearMonthFile(period)}${book.replace('.', '')}.txt`,
      content: [header, ...lines].join('\n'),
      rowCount: lines.length,
    };
  }

  private parsePeriod(period: string) {
    const match = /^(\d{4})-(\d{2})$/.exec(period.trim());
    if (!match) {
      throw new Error('Periodo inválido. Use formato YYYY-MM');
    }
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (month < 1 || month > 12) throw new Error('Mes inválido');
    return { year, month };
  }

  private async resolveTimeZone(establishmentId: string): Promise<string> {
    const row = await this.prisma.establishment.findFirst({
      where: { id: establishmentId, deletedAt: null },
      select: { timeZone: true },
    });
    return normalizeTimeZone(row?.timeZone);
  }
}

function yearMonthFile(period: string): string {
  return period.replace('-', '');
}