import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  formatDateYmdInTimeZone,
  monthBoundsInTimeZone,
  normalizeTimeZone,
} from '../../../common/utils/timezone.util';
import * as XLSX from 'xlsx';

@Injectable()
export class SunatBooksService {
  constructor(private readonly prisma: PrismaService) {}

  async buildSalesRegisterBuffer(establishmentId: string, period: string) {
    const tz = await this.resolveTimeZone(establishmentId);
    const { start: from, end: to } = monthBoundsInTimeZone(period, tz);

    const config = await this.prisma.establishmentBillingConfig.findUnique({
      where: { establishmentId },
      select: { rucEmisor: true, razonSocialEmisor: true },
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
        electronicDocument: {
          select: { sunatStatus: true, documentType: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const rows = sales.map((sale, idx) => {
      const docTipo = this.mapSaleDocumentType(sale.documentType);
      const clienteTipo = this.mapCustomerDocType(sale.customer?.tipoDocumento);
      return {
        PERIODO: period.replace('-', ''),
        RUC: ruc,
        CORRELATIVO: String(idx + 1).padStart(5, '0'),
        FECHA_EMISION: formatDateYmdInTimeZone(sale.createdAt, tz),
        FECHA_VENCIMIENTO: formatDateYmdInTimeZone(sale.createdAt, tz),
        TIPO_COMPROBANTE: docTipo,
        SERIE: sale.serie ?? '',
        NUMERO: sale.numero ?? '',
        NUMERO_FINAL: sale.numero ?? '',
        TIPO_DOC_CLIENTE: clienteTipo,
        NUM_DOC_CLIENTE: sale.customer?.numeroDocumento ?? '',
        NOMBRE_CLIENTE: sale.customer?.nombre ?? 'CLIENTE VARIOS',
        BASE_IMPONIBLE: sale.subtotal.toString(),
        IGV: sale.igvTotal.toString(),
        IMPORTE_TOTAL: sale.total.toString(),
        MONEDA: 'PEN',
        ESTADO_SUNAT: sale.electronicDocument?.sunatStatus ?? 'SIN_CPE',
        TIPO_CPE: sale.electronicDocument?.documentType ?? '',
      };
    });

    return this.toXlsxBuffer(rows, 'RVIE-Ventas', `RVIE-Ventas-${period}.xlsx`);
  }

  async buildInventoryRegisterBuffer(establishmentId: string, period: string) {
    const tz = await this.resolveTimeZone(establishmentId);
    const stocks = await this.prisma.productLotStock.findMany({
      where: {
        warehouse: { establishmentId, deletedAt: null },
        deletedAt: null,
        stock: { gt: 0 },
      },
      include: {
        product: {
          select: {
            nombre: true,
            codigoInterno: true,
            codigoSunat: true,
            codigoMedicamentoDigemid: true,
            unit: { select: { codigo: true } },
          },
        },
        warehouse: { select: { nombre: true } },
      },
      orderBy: [{ warehouseId: 'asc' }, { productId: 'asc' }],
    });

    const config = await this.prisma.establishmentBillingConfig.findUnique({
      where: { establishmentId },
      select: { rucEmisor: true },
    });
    const ruc = config?.rucEmisor ?? '00000000000';
    const periodo = period.replace('-', '');

    const rows = stocks.map((row, idx) => ({
      PERIODO: periodo,
      RUC: ruc,
      CORRELATIVO: String(idx + 1).padStart(5, '0'),
      ALMACEN: row.warehouse.nombre,
      COD_ALMACEN: row.warehouseId.slice(0, 8),
      PRODUCTO: row.product.nombre,
      CODIGO_INTERNO: row.product.codigoInterno ?? '',
      CODIGO_SUNAT: row.product.codigoSunat ?? '',
      CODIGO_DIGEMID: row.product.codigoMedicamentoDigemid ?? '',
      LOTE: row.codigoLote,
      UNIDAD: row.product.unit?.codigo ?? 'NIU',
      STOCK: row.stock.toString(),
      COSTO_UNITARIO: row.costoUnitario?.toString() ?? '0',
      VALOR_TOTAL: row.costoUnitario
        ? row.stock.mul(row.costoUnitario).toDecimalPlaces(4).toString()
        : '0',
      FECHA_VENCIMIENTO: row.fechaVencimiento
        ? formatDateYmdInTimeZone(row.fechaVencimiento, tz)
        : '',
    }));

    return this.toXlsxBuffer(rows, 'Registro-Inventario', `Registro-Inventario-${period}.xlsx`);
  }

  private mapSaleDocumentType(type: string): string {
    const map: Record<string, string> = {
      FACTURA: '01',
      BOLETA: '03',
      NOTA_VENTA: '00',
      TICKET: '03',
    };
    return map[type] ?? '00';
  }

  private mapCustomerDocType(type?: string): string {
    const map: Record<string, string> = {
      DNI: '1',
      RUC: '6',
      CE: '4',
      PASAPORTE: '7',
      DOC_SIN_RUC: '0',
      OTRO: '0',
    };
    return type ? (map[type] ?? '0') : '0';
  }

  private parsePeriod(period: string) {
    const match = /^(\d{4})-(\d{2})$/.exec(period.trim());
    if (!match) throw new Error('Periodo inválido. Use formato YYYY-MM');
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

  private toXlsxBuffer(
    rows: Record<string, string>[],
    sheetName: string,
    filename: string,
  ) {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    return { buffer, filename, rowCount: rows.length };
  }
}
