import { Injectable } from '@nestjs/common';
import {
  ControlledLedgerMovementType,
  InventoryMovementType,
  Prisma,
} from '../../generated/prisma/client';
import {
  dateRangeBoundsInTimeZone,
  formatDateYmdInTimeZone,
  formatHourInTimeZone,
  monthBoundsInTimeZone,
  normalizeTimeZone,
} from '../../common/utils/timezone.util';
import { PrismaService } from '../../prisma/prisma.service';
import * as XLSX from 'xlsx';

type DateRangeInput = { from?: string; to?: string };
type DateRange = { from?: Date; to?: Date; timeZone?: string };

@Injectable()
export class PharmaceuticalService {
  constructor(private readonly prisma: PrismaService) {}

  async recordControlledOutflow(
    establishmentId: string,
    items: Array<{ productId: string; cantidad: Prisma.Decimal }>,
    reference: string,
    userId?: string,
  ) {
    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        select: { esControlado: true },
      });
      if (!product?.esControlado) continue;

      const last = await this.prisma.controlledSubstanceLedgerEntry.findFirst({
        where: { establishmentId, productId: item.productId },
        orderBy: { fecha: 'desc' },
        select: { saldo: true },
      });
      const saldo = (last?.saldo ?? new Prisma.Decimal(0)).minus(item.cantidad);

      await this.prisma.controlledSubstanceLedgerEntry.create({
        data: {
          establishmentId,
          productId: item.productId,
          movementType: ControlledLedgerMovementType.SALIDA,
          cantidad: item.cantidad,
          saldo,
          referencia: reference,
          userId: userId ?? null,
        },
      });
    }
  }

  async listApprovers(establishmentId: string, excludeUserId?: string) {
    return this.prisma.user.findMany({
      where: {
        establecimientoId: establishmentId,
        deletedAt: null,
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
      select: { id: true, nombre: true, role: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async topProducts(establishmentId: string, limit = 10) {
    const rows = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: { sale: { establishmentId, deletedAt: null, estado: 'COMPLETADA' } },
      _sum: { cantidad: true, totalLinea: true },
      orderBy: { _sum: { totalLinea: 'desc' } },
      take: limit,
    });
    const products = await this.prisma.product.findMany({
      where: { id: { in: rows.map((r) => r.productId) } },
      select: { id: true, nombre: true, codigoInterno: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    return rows.map((r) => ({
      product: byId.get(r.productId),
      cantidad: r._sum.cantidad?.toString() ?? '0',
      total: r._sum.totalLinea?.toString() ?? '0',
    }));
  }

  async rotationAbc(establishmentId: string) {
    const rows = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: { sale: { establishmentId, deletedAt: null, estado: 'COMPLETADA' } },
      _sum: { totalLinea: true },
    });
    const sorted = rows
      .map((r) => ({ productId: r.productId, total: Number(r._sum.totalLinea?.toString() ?? '0') }))
      .sort((a, b) => b.total - a.total);
    const grand = sorted.reduce((s, r) => s + r.total, 0) || 1;
    let cumulative = 0;
    const products = await this.prisma.product.findMany({
      where: { id: { in: sorted.map((s) => s.productId) } },
      select: { id: true, nombre: true, codigoInterno: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    return sorted.map((row) => {
      cumulative += row.total;
      const pct = cumulative / grand;
      const clase = pct <= 0.8 ? 'A' : pct <= 0.95 ? 'B' : 'C';
      return {
        product: byId.get(row.productId),
        total: row.total.toFixed(2),
        clase,
        acumuladoPct: (pct * 100).toFixed(1),
      };
    });
  }

  async monthlyControlledReport(establishmentId: string, year: number, month: number) {
    const tz = await this.resolveTimeZone(establishmentId);
    const yearMonth = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
    const { start, end } = monthBoundsInTimeZone(yearMonth, tz);

    const entries = await this.prisma.controlledSubstanceLedgerEntry.findMany({
      where: { establishmentId, fecha: { gte: start, lt: end } },
      include: {
        product: {
          select: {
            nombre: true,
            codigoInterno: true,
            controlledSubstanceCategory: { select: { codigo: true, nombre: true, schedule: true } },
          },
        },
        user: { select: { nombre: true } },
      },
      orderBy: [{ productId: 'asc' }, { fecha: 'asc' }],
    });

    const summaryMap = new Map<
      string,
      {
        productId: string;
        producto: string;
        codigoInterno: string | null;
        categoria: string | null;
        schedule: string | null;
        entradas: Prisma.Decimal;
        salidas: Prisma.Decimal;
        saldoFinal: Prisma.Decimal;
      }
    >();

    for (const entry of entries) {
      const key = entry.productId;
      let current = summaryMap.get(key);
      if (!current) {
        current = {
          productId: entry.productId,
          producto: entry.product.nombre,
          codigoInterno: entry.product.codigoInterno,
          categoria: entry.product.controlledSubstanceCategory?.nombre ?? null,
          schedule: entry.product.controlledSubstanceCategory?.schedule ?? null,
          entradas: new Prisma.Decimal(0),
          salidas: new Prisma.Decimal(0),
          saldoFinal: new Prisma.Decimal(0),
        };
      }
      if (entry.movementType === ControlledLedgerMovementType.ENTRADA) {
        current.entradas = current.entradas.plus(entry.cantidad);
      } else {
        current.salidas = current.salidas.plus(entry.cantidad);
      }
      current.saldoFinal = entry.saldo;
      summaryMap.set(key, current);
    }

    return {
      period: { year, month, from: start.toISOString(), to: end.toISOString() },
      entries: entries.map((e) => ({
        id: e.id,
        fecha: e.fecha.toISOString(),
        movementType: e.movementType,
        cantidad: e.cantidad.toString(),
        saldo: e.saldo.toString(),
        referencia: e.referencia,
        producto: e.product.nombre,
        codigoInterno: e.product.codigoInterno,
        categoria: e.product.controlledSubstanceCategory?.nombre ?? null,
        schedule: e.product.controlledSubstanceCategory?.schedule ?? null,
        usuario: e.user?.nombre ?? null,
      })),
      summary: [...summaryMap.values()].map((s) => ({
        ...s,
        entradas: s.entradas.toString(),
        salidas: s.salidas.toString(),
        saldoFinal: s.saldoFinal.toString(),
      })),
    };
  }

  async shrinkageAndExpiryReport(
    establishmentId: string,
    warehouseId?: string,
    expiryDaysAhead = 90,
    range?: DateRangeInput,
  ) {
    const warehouseIds = await this.resolveWarehouseIds(establishmentId, warehouseId);
    const dateFilter = await this.buildDateFilter(establishmentId, range);

    const shrinkageMovements = await this.prisma.inventoryInboundMovement.findMany({
      where: {
        deletedAt: null,
        movementType: InventoryMovementType.AJUSTE,
        cantidad: { lt: 0 },
        warehouseId: { in: warehouseIds },
        ...(dateFilter ? { fechaRegistro: dateFilter } : {}),
      },
      include: {
        product: { select: { nombre: true, codigoInterno: true, costoUnitario: true } },
        warehouse: { select: { nombre: true } },
      },
      orderBy: { fechaRegistro: 'desc' },
      take: 500,
    });

    const shrinkage = shrinkageMovements.map((m) => {
      const qty = m.cantidad.abs();
      const unitCost = m.costoUnitario ?? m.product.costoUnitario ?? new Prisma.Decimal(0);
      return {
        tipo: 'MERMA' as const,
        fecha: m.fechaRegistro.toISOString(),
        producto: m.product.nombre,
        codigoInterno: m.product.codigoInterno,
        almacen: m.warehouse.nombre,
        cantidad: qty.toString(),
        valorizado: qty.times(unitCost).toString(),
        referencia: m.comentario ?? null,
      };
    });

    const expiryLimit = new Date();
    expiryLimit.setDate(expiryLimit.getDate() + expiryDaysAhead);

    const lots = await this.prisma.productLotStock.findMany({
      where: {
        deletedAt: null,
        stock: { gt: 0 },
        warehouseId: { in: warehouseIds },
        fechaVencimiento: { not: null, lte: expiryLimit },
      },
      include: {
        product: { select: { nombre: true, codigoInterno: true } },
        warehouse: { select: { nombre: true } },
      },
      orderBy: { fechaVencimiento: 'asc' },
      take: 500,
    });

    const expiring = lots.map((lot) => {
      const unitCost = lot.costoUnitario ?? new Prisma.Decimal(0);
      return {
        tipo: 'VENCIMIENTO' as const,
        fecha: lot.fechaVencimiento!.toISOString(),
        producto: lot.product.nombre,
        codigoInterno: lot.product.codigoInterno,
        almacen: lot.warehouse.nombre,
        lote: lot.codigoLote,
        cantidad: lot.stock.toString(),
        valorizado: lot.stock.times(unitCost).toString(),
      };
    });

    const totalMermas = shrinkage.reduce((acc, r) => acc + Number(r.valorizado), 0);
    const totalVencimientos = expiring.reduce((acc, r) => acc + Number(r.valorizado), 0);

    return {
      shrinkage,
      expiring,
      totales: {
        mermasValorizado: totalMermas.toFixed(2),
        vencimientosValorizado: totalVencimientos.toFixed(2),
        total: (totalMermas + totalVencimientos).toFixed(2),
      },
    };
  }

  async profitabilityReport(
    establishmentId: string,
    groupBy: 'product' | 'category' | 'laboratory' = 'product',
    range?: DateRangeInput,
  ) {
    const dateFilter = await this.buildDateFilter(establishmentId, range);
    const saleItems = await this.prisma.saleItem.findMany({
      where: {
        sale: {
          establishmentId,
          deletedAt: null,
          estado: 'COMPLETADA',
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
      },
      select: {
        cantidad: true,
        totalLinea: true,
        product: {
          select: {
            id: true,
            nombre: true,
            codigoInterno: true,
            costoUnitario: true,
            category: { select: { id: true, nombre: true } },
            brand: { select: { id: true, nombre: true } },
          },
        },
      },
    });

    type Bucket = { key: string; label: string; ventas: number; costo: number; utilidad: number; margenPct: number };
    const buckets = new Map<string, Bucket>();

    for (const item of saleItems) {
      const revenue = Number(item.totalLinea.toString());
      const unitCost = Number((item.product.costoUnitario ?? new Prisma.Decimal(0)).toString());
      const cost = unitCost * Number(item.cantidad.toString());

      let key: string;
      let label: string;
      if (groupBy === 'category') {
        key = item.product.category?.id ?? 'sin-categoria';
        label = item.product.category?.nombre ?? 'Sin categoría';
      } else if (groupBy === 'laboratory') {
        key = item.product.brand?.id ?? 'sin-laboratorio';
        label = item.product.brand?.nombre ?? 'Sin laboratorio';
      } else {
        key = item.product.id;
        label = item.product.nombre;
      }

      const row = buckets.get(key) ?? { key, label, ventas: 0, costo: 0, utilidad: 0, margenPct: 0 };
      row.ventas += revenue;
      row.costo += cost;
      buckets.set(key, row);
    }

    return [...buckets.values()]
      .map((row) => {
        row.utilidad = row.ventas - row.costo;
        row.margenPct = row.ventas > 0 ? (row.utilidad / row.ventas) * 100 : 0;
        return {
          ...row,
          ventas: row.ventas.toFixed(2),
          costo: row.costo.toFixed(2),
          utilidad: row.utilidad.toFixed(2),
          margenPct: row.margenPct.toFixed(1),
        };
      })
      .sort((a, b) => Number(b.utilidad) - Number(a.utilidad));
  }

  async salesAnalyticsReport(
    establishmentId: string,
    groupBy: 'seller' | 'warehouse' | 'hour' | 'day' = 'seller',
    range?: DateRangeInput,
    warehouseId?: string,
  ) {
    const parsed = await this.parseRange(establishmentId, range?.from, range?.to);
    const dateFilter = this.buildDateFilterFromParsed(parsed);
    const tz = parsed.timeZone ?? (await this.resolveTimeZone(establishmentId));
    const sales = await this.prisma.sale.findMany({
      where: {
        establishmentId,
        deletedAt: null,
        estado: 'COMPLETADA',
        ...(warehouseId ? { warehouseId } : {}),
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      select: {
        total: true,
        createdAt: true,
        seller: { select: { id: true, nombre: true } },
        warehouse: { select: { id: true, nombre: true } },
      },
    });

    type Bucket = { key: string; label: string; ventas: number; transacciones: number };
    const buckets = new Map<string, Bucket>();

    for (const sale of sales) {
      let key: string;
      let label: string;
      const d = sale.createdAt;
      if (groupBy === 'warehouse') {
        key = sale.warehouse.id;
        label = sale.warehouse.nombre;
      } else if (groupBy === 'hour') {
        key = formatHourInTimeZone(d, tz);
        label = `${key}:00`;
      } else if (groupBy === 'day') {
        key = formatDateYmdInTimeZone(d, tz);
        label = key;
      } else {
        key = sale.seller.id;
        label = sale.seller.nombre;
      }

      const row = buckets.get(key) ?? { key, label, ventas: 0, transacciones: 0 };
      row.ventas += Number(sale.total.toString());
      row.transacciones += 1;
      buckets.set(key, row);
    }

    return [...buckets.values()]
      .map((row) => ({ ...row, ventas: row.ventas.toFixed(2) }))
      .sort((a, b) => Number(b.ventas) - Number(a.ventas));
  }

  async dispensationByMedicoReport(establishmentId: string, range?: DateRangeInput) {
    const dateFilter = await this.buildDateFilter(establishmentId, range);
    const sales = await this.prisma.sale.findMany({
      where: {
        establishmentId,
        deletedAt: null,
        estado: 'COMPLETADA',
        prescriptionId: { not: null },
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      select: {
        total: true,
        items: { select: { cantidad: true } },
        prescription: {
          select: {
            medicoId: true,
            medicoNombre: true,
            medicoCmp: true,
            medico: { select: { nombres: true, apellidos: true, cmp: true } },
          },
        },
      },
    });

    type Bucket = {
      medicoId: string | null;
      medicoNombre: string;
      medicoCmp: string | null;
      dispensaciones: number;
      items: number;
      total: number;
    };
    const buckets = new Map<string, Bucket>();

    for (const sale of sales) {
      const rx = sale.prescription;
      if (!rx) continue;
      const key = rx.medicoId ?? rx.medicoCmp ?? rx.medicoNombre ?? 'sin-medico';
      const nombre =
        rx.medicoNombre ??
        (rx.medico ? `${rx.medico.nombres} ${rx.medico.apellidos}` : 'Médico no registrado');
      const row = buckets.get(key) ?? {
        medicoId: rx.medicoId,
        medicoNombre: nombre,
        medicoCmp: rx.medicoCmp ?? rx.medico?.cmp ?? null,
        dispensaciones: 0,
        items: 0,
        total: 0,
      };
      row.dispensaciones += 1;
      row.items += sale.items.reduce((acc, i) => acc + Number(i.cantidad.toString()), 0);
      row.total += Number(sale.total.toString());
      buckets.set(key, row);
    }

    return [...buckets.values()]
      .map((row) => ({
        ...row,
        total: row.total.toFixed(2),
      }))
      .sort((a, b) => Number(b.total) - Number(a.total));
  }

  async listControlledLedger(
    establishmentId: string,
    productId?: string,
    from?: string,
    to?: string,
  ) {
    const range = await this.parseRange(establishmentId, from, to);
    return this.prisma.controlledSubstanceLedgerEntry.findMany({
      where: {
        establishmentId,
        ...(productId ? { productId } : {}),
        ...(range.from || range.to
          ? {
              fecha: {
                ...(range.from ? { gte: range.from } : {}),
                ...(range.to ? { lt: range.to } : {}),
              },
            }
          : {}),
      },
      orderBy: { fecha: 'desc' },
      take: 200,
      include: {
        product: {
          select: {
            nombre: true,
            codigoInterno: true,
            controlledSubstanceCategory: { select: { codigo: true, nombre: true, schedule: true } },
          },
        },
        user: { select: { nombre: true } },
      },
    });
  }

  async buildControlledLedgerExportBuffer(
    establishmentId: string,
    from?: string,
    to?: string,
  ) {
    const range = await this.parseRange(establishmentId, from, to);
    const entries = await this.prisma.controlledSubstanceLedgerEntry.findMany({
      where: {
        establishmentId,
        ...(range.from || range.to
          ? {
              fecha: {
                ...(range.from ? { gte: range.from } : {}),
                ...(range.to ? { lt: range.to } : {}),
              },
            }
          : {}),
      },
      include: {
        product: {
          select: {
            nombre: true,
            codigoInterno: true,
            controlledSubstanceCategory: { select: { codigo: true, nombre: true, schedule: true } },
          },
        },
        user: { select: { nombre: true } },
      },
      orderBy: { fecha: 'asc' },
    });

    const rows = entries.map((e) => ({
      FECHA: e.fecha.toISOString(),
      PRODUCTO: e.product.nombre,
      CODIGO: e.product.codigoInterno ?? '',
      CATEGORIA: e.product.controlledSubstanceCategory?.nombre ?? '',
      SCHEDULE: e.product.controlledSubstanceCategory?.schedule ?? '',
      MOVIMIENTO: e.movementType,
      CANTIDAD: e.cantidad.toString(),
      SALDO: e.saldo.toString(),
      REFERENCIA: e.referencia ?? '',
      USUARIO: e.user?.nombre ?? '',
    }));

    return this.toXlsxBuffer(rows, 'libro-controlados');
  }

  async buildAdverseEventsExportBuffer(establishmentId: string) {
    const events = await this.prisma.adverseEvent.findMany({
      where: { establishmentId, deletedAt: null },
      include: {
        product: { select: { nombre: true, codigoInterno: true } },
        customer: { select: { nombre: true, numeroDocumento: true } },
      },
      orderBy: { fecha: 'desc' },
    });

    const rows = events.map((e) => ({
      FECHA: e.fecha.toISOString(),
      PRODUCTO: e.product.nombre,
      CODIGO: e.product.codigoInterno ?? '',
      PACIENTE: e.customer?.nombre ?? '',
      DOCUMENTO: e.customer?.numeroDocumento ?? '',
      SEVERIDAD: e.severidad,
      DESCRIPCION: e.descripcion,
      NOTIFICADO_DIGEMID: e.notificadoDigemid ? 'SI' : 'NO',
      NRO_REPORTE: e.digemidReportNumber ?? '',
      FECHA_NOTIFICACION: e.fechaNotificacion?.toISOString() ?? '',
      MEDIDAS: e.medidasCorrectivas ?? '',
      CIE10: e.cie10Codigo ?? '',
    }));

    return this.toXlsxBuffer(rows, 'farmacovigilancia');
  }

  async sanitaryRegistryAlerts(establishmentId: string, daysAhead = 90) {
    const limit = new Date();
    limit.setDate(limit.getDate() + daysAhead);
    const products = await this.prisma.product.findMany({
      where: {
        deletedAt: null,
        registroSanitario: { not: null },
        registroSanitarioVigencia: { not: null, lte: limit },
      },
      select: {
        id: true,
        nombre: true,
        registroSanitario: true,
        registroSanitarioVigencia: true,
        codigoMedicamentoDigemid: true,
      },
      orderBy: { registroSanitarioVigencia: 'asc' },
      take: 200,
    });
    const now = new Date();
    return products.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      registroSanitario: p.registroSanitario,
      codigoMedicamentoDigemid: p.codigoMedicamentoDigemid,
      registroSanitarioVigencia: p.registroSanitarioVigencia?.toISOString() ?? null,
      estado:
        p.registroSanitarioVigencia && p.registroSanitarioVigencia < now
          ? 'VENCIDO'
          : 'POR_VENCER',
    }));
  }

  async lotTraceabilityReport(establishmentId: string, codigoLote: string) {
    const lote = codigoLote.trim();
    const inbound = await this.prisma.inventoryInboundMovement.findMany({
      where: {
        codigoLote: lote,
        deletedAt: null,
        warehouse: { establishmentId, deletedAt: null },
      },
      include: {
        product: { select: { nombre: true, codigoInterno: true } },
        warehouse: { select: { nombre: true } },
      },
      orderBy: { fechaRegistro: 'asc' },
    });

    const outbound = await this.prisma.saleItemLot.findMany({
      where: { codigoLote: lote },
      include: {
        saleItem: {
          include: {
            sale: {
              select: {
                id: true,
                serie: true,
                numero: true,
                createdAt: true,
                establishmentId: true,
                customer: { select: { nombre: true, numeroDocumento: true } },
              },
            },
            product: { select: { nombre: true, codigoInterno: true } },
          },
        },
      },
    });

    return {
      codigoLote: lote,
      entradas: inbound.map((e) => ({
        fecha: e.fechaRegistro.toISOString(),
        producto: e.product.nombre,
        codigo: e.product.codigoInterno ?? '',
        almacen: e.warehouse.nombre,
        cantidad: e.cantidad.toString(),
        referencia: e.referencia ?? '',
      })),
      ventas: outbound
        .filter((o) => o.saleItem.sale.establishmentId === establishmentId)
        .map((o) => ({
          saleId: o.saleItem.sale.id,
          documento: `${o.saleItem.sale.serie ?? ''}-${o.saleItem.sale.numero ?? ''}`,
          fecha: o.saleItem.sale.createdAt.toISOString(),
          producto: o.saleItem.product.nombre,
          cantidad: o.cantidad.toString(),
          cliente: o.saleItem.sale.customer?.nombre ?? 'SIN CLIENTE',
          documentoCliente: o.saleItem.sale.customer?.numeroDocumento ?? '',
        })),
    };
  }

  async bpaStorageReport(establishmentId: string) {
    const zones = await this.prisma.warehouseZone.findMany({
      where: { warehouse: { establishmentId, deletedAt: null }, deletedAt: null },
      include: {
        warehouse: { select: { nombre: true } },
        temperatureLogs: {
          take: 30,
          orderBy: { fecha: 'desc' },
          select: { fecha: true, temperaturaCelsius: true, observacion: true },
        },
      },
    });
    return zones.map((z) => ({
      almacen: z.warehouse.nombre,
      zona: z.nombre,
      tipo: z.tipo,
      registrosTemperatura: z.temperatureLogs.map((l) => ({
        fecha: l.fecha.toISOString(),
        temperaturaCelsius: l.temperaturaCelsius.toString(),
        observacion: l.observacion,
      })),
    }));
  }

  async buildInspectionExportBuffer(establishmentId: string) {
    const establishment = await this.prisma.establishment.findFirst({
      where: { id: establishmentId },
      select: { nombre: true, codigo: true, numeroRegistroDigemid: true },
    });
    const alerts = await this.sanitaryRegistryAlerts(establishmentId, 180);
    const bpa = await this.bpaStorageReport(establishmentId);

    const rows: Record<string, string>[] = [
      {
        SECCION: 'ESTABLECIMIENTO',
        CAMPO: 'Nombre',
        VALOR: establishment?.nombre ?? '',
      },
      {
        SECCION: 'ESTABLECIMIENTO',
        CAMPO: 'Codigo',
        VALOR: establishment?.codigo ?? '',
      },
      {
        SECCION: 'ESTABLECIMIENTO',
        CAMPO: 'Registro DIGEMID',
        VALOR: establishment?.numeroRegistroDigemid ?? '',
      },
      ...alerts.map((a) => ({
        SECCION: 'REGISTRO_SANITARIO',
        CAMPO: a.nombre,
        VALOR: `${a.registroSanitario ?? ''} | ${a.registroSanitarioVigencia ?? ''} | ${a.estado}`,
      })),
      ...bpa.map((zone) => ({
        SECCION: 'BPA',
        CAMPO: `${zone.almacen} - ${zone.zona}`,
        VALOR: zone.tipo,
      })),
    ];

    return this.toXlsxBuffer(rows, 'inspeccion-digemid');
  }

  async anonymizedSalesStats(establishmentId: string, limit = 20) {
    const rows = await this.topProducts(establishmentId, limit);
    return rows.map((row) => ({
      product: row.product,
      cantidad: row.cantidad,
      total: row.total,
    }));
  }

  private async resolveWarehouseIds(establishmentId: string, warehouseId?: string) {
    if (warehouseId) return [warehouseId];
    const rows = await this.prisma.warehouse.findMany({
      where: { establishmentId, deletedAt: null },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  private async buildDateFilter(
    establishmentId: string,
    range?: DateRangeInput,
  ): Promise<Prisma.DateTimeFilter | undefined> {
    const parsed = await this.parseRange(establishmentId, range?.from, range?.to);
    return this.buildDateFilterFromParsed(parsed);
  }

  private buildDateFilterFromParsed(range?: DateRange): Prisma.DateTimeFilter | undefined {
    if (!range?.from && !range?.to) return undefined;
    return {
      ...(range.from ? { gte: range.from } : {}),
      ...(range.to ? { lt: range.to } : {}),
    };
  }

  private async parseRange(
    establishmentId: string,
    from?: string,
    to?: string,
  ): Promise<DateRange> {
    if (!from && !to) return {};
    const tz = await this.resolveTimeZone(establishmentId);
    const fromYmd = from?.trim();
    const toYmd = to?.trim();
    if (fromYmd && toYmd) {
      const { start, end } = dateRangeBoundsInTimeZone(fromYmd, toYmd, tz);
      return { from: start, to: end, timeZone: tz };
    }
    if (fromYmd) {
      const { start } = dateRangeBoundsInTimeZone(fromYmd, fromYmd, tz);
      return { from: start, timeZone: tz };
    }
    const { end } = dateRangeBoundsInTimeZone(toYmd!, toYmd!, tz);
    return { to: end, timeZone: tz };
  }

  private async resolveTimeZone(establishmentId: string): Promise<string> {
    const row = await this.prisma.establishment.findFirst({
      where: { id: establishmentId, deletedAt: null },
      select: { timeZone: true },
    });
    return normalizeTimeZone(row?.timeZone);
  }

  private toXlsxBuffer(rows: Record<string, string>[], sheetName: string) {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }
}
