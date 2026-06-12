import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  ProductPriceChangeSource,
  ProductPriceField,
} from '../../generated/prisma/client';
import { buildPaginatedResult } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateProductDto } from './dto/create-product.dto';
import { ProductPriceHistoryQueryDto } from './dto/product-price-history-query.dto';

type Tx = Prisma.TransactionClient;

export type ProductPriceSnapshot = {
  precioUnitarioVenta: Prisma.Decimal;
  precioUnitarioCompra: Prisma.Decimal | null;
  costoUnitario: Prisma.Decimal | null;
  warehousePrices: { warehouseId: string; precio: Prisma.Decimal }[];
  presentations: {
    unitId: string;
    factor: Prisma.Decimal;
    precio1: Prisma.Decimal;
    precio2: Prisma.Decimal;
    precio3: Prisma.Decimal;
  }[];
};

type HistoryEntry = {
  field: ProductPriceField;
  warehouseId?: string;
  presentationKey?: string;
  previousValue: Prisma.Decimal | null;
  newValue: Prisma.Decimal;
};

const FIELD_LABELS: Record<ProductPriceField, string> = {
  [ProductPriceField.PRECIO_VENTA]: 'Precio unitario venta',
  [ProductPriceField.PRECIO_COMPRA]: 'Precio unitario compra',
  [ProductPriceField.COSTO_UNITARIO]: 'Costo unitario',
  [ProductPriceField.PRECIO_ALMACEN]: 'Precio por almacén',
  [ProductPriceField.PRESENTACION_PRECIO_1]: 'Presentación — Precio 1',
  [ProductPriceField.PRESENTACION_PRECIO_2]: 'Presentación — Precio 2',
  [ProductPriceField.PRESENTACION_PRECIO_3]: 'Presentación — Precio 3',
};

const SOURCE_LABELS: Record<ProductPriceChangeSource, string> = {
  [ProductPriceChangeSource.MANUAL]: 'Manual',
  [ProductPriceChangeSource.IMPORT]: 'Importación',
  [ProductPriceChangeSource.DUPLICATE]: 'Duplicado',
};

@Injectable()
export class ProductPriceHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(productId: string, query: ProductPriceHistoryQueryDto) {
    const exists = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Producto no encontrado');

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const [total, rows] = await Promise.all([
      this.prisma.productPriceHistory.count({ where: { productId } }),
      this.prisma.productPriceHistory.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          warehouse: { select: { id: true, nombre: true } },
          changedBy: { select: { id: true, nombre: true, email: true } },
        },
      }),
    ]);

    const items = rows.map((row) => ({
      id: row.id,
      productId: row.productId,
      field: row.field,
      fieldLabel: FIELD_LABELS[row.field],
      warehouseId: row.warehouseId,
      warehouseNombre: row.warehouse?.nombre ?? null,
      presentationKey: row.presentationKey,
      previousValue: row.previousValue?.toString() ?? null,
      newValue: row.newValue.toString(),
      source: row.source,
      sourceLabel: SOURCE_LABELS[row.source],
      changedBy: row.changedBy
        ? { id: row.changedBy.id, nombre: row.changedBy.nombre, email: row.changedBy.email }
        : null,
      createdAt: row.createdAt.toISOString(),
    }));

    return buildPaginatedResult(items, total, page, pageSize);
  }

  async loadSnapshot(productId: string): Promise<ProductPriceSnapshot | null> {
    return this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
      select: {
        precioUnitarioVenta: true,
        precioUnitarioCompra: true,
        costoUnitario: true,
        warehousePrices: { select: { warehouseId: true, precio: true } },
        presentations: {
          select: {
            unitId: true,
            factor: true,
            precio1: true,
            precio2: true,
            precio3: true,
          },
          orderBy: { orden: 'asc' },
        },
      },
    });
  }

  async recordOnCreate(
    tx: Tx,
    productId: string,
    dto: CreateProductDto,
    actorId?: string,
    source: ProductPriceChangeSource = ProductPriceChangeSource.MANUAL,
  ) {
    const entries: HistoryEntry[] = [];

    entries.push({
      field: ProductPriceField.PRECIO_VENTA,
      previousValue: null,
      newValue: new Prisma.Decimal(dto.precioUnitarioVenta),
    });

    if (dto.precioUnitarioCompra !== undefined && dto.precioUnitarioCompra !== null) {
      entries.push({
        field: ProductPriceField.PRECIO_COMPRA,
        previousValue: null,
        newValue: new Prisma.Decimal(dto.precioUnitarioCompra),
      });
    }

    if (dto.costoUnitario !== undefined && dto.costoUnitario !== null) {
      entries.push({
        field: ProductPriceField.COSTO_UNITARIO,
        previousValue: null,
        newValue: new Prisma.Decimal(dto.costoUnitario),
      });
    }

    for (const wp of dto.warehousePrices ?? []) {
      entries.push({
        field: ProductPriceField.PRECIO_ALMACEN,
        warehouseId: wp.warehouseId,
        previousValue: null,
        newValue: new Prisma.Decimal(wp.precio),
      });
    }

    for (const pr of dto.presentations ?? []) {
      const key = this.presentationKey(pr.unitId, pr.factor ?? 0);
      const p1 = Number(pr.precio1 ?? 0);
      const p2 = Number(pr.precio2 ?? 0);
      const p3 = Number(pr.precio3 ?? 0);
      if (p1 > 0) {
        entries.push({
          field: ProductPriceField.PRESENTACION_PRECIO_1,
          presentationKey: key,
          previousValue: null,
          newValue: new Prisma.Decimal(p1),
        });
      }
      if (p2 > 0) {
        entries.push({
          field: ProductPriceField.PRESENTACION_PRECIO_2,
          presentationKey: key,
          previousValue: null,
          newValue: new Prisma.Decimal(p2),
        });
      }
      if (p3 > 0) {
        entries.push({
          field: ProductPriceField.PRESENTACION_PRECIO_3,
          presentationKey: key,
          previousValue: null,
          newValue: new Prisma.Decimal(p3),
        });
      }
    }

    await this.persist(tx, productId, entries, actorId, source);
  }

  async recordOnUpdate(
    tx: Tx,
    productId: string,
    before: ProductPriceSnapshot,
    dto: CreateProductDto,
    actorId?: string,
    source: ProductPriceChangeSource = ProductPriceChangeSource.MANUAL,
  ) {
    const entries: HistoryEntry[] = [];

    this.pushDecimalChange(
      entries,
      ProductPriceField.PRECIO_VENTA,
      before.precioUnitarioVenta,
      new Prisma.Decimal(dto.precioUnitarioVenta),
    );

    const newCompra =
      dto.precioUnitarioCompra !== undefined && dto.precioUnitarioCompra !== null
        ? new Prisma.Decimal(dto.precioUnitarioCompra)
        : null;
    this.pushNullableDecimalChange(
      entries,
      ProductPriceField.PRECIO_COMPRA,
      before.precioUnitarioCompra,
      newCompra,
    );

    const newCosto =
      dto.costoUnitario !== undefined && dto.costoUnitario !== null
        ? new Prisma.Decimal(dto.costoUnitario)
        : null;
    this.pushNullableDecimalChange(
      entries,
      ProductPriceField.COSTO_UNITARIO,
      before.costoUnitario,
      newCosto,
    );

    if (dto.warehousePrices) {
      const beforeMap = new Map(before.warehousePrices.map((w) => [w.warehouseId, w.precio]));
      const afterIds = new Set<string>();
      for (const wp of dto.warehousePrices) {
        afterIds.add(wp.warehouseId);
        const prev = beforeMap.get(wp.warehouseId) ?? null;
        const next = new Prisma.Decimal(wp.precio);
        if (!this.decimalsEqual(prev, next)) {
          entries.push({
            field: ProductPriceField.PRECIO_ALMACEN,
            warehouseId: wp.warehouseId,
            previousValue: prev,
            newValue: next,
          });
        }
      }
      for (const [warehouseId, prev] of beforeMap) {
        if (!afterIds.has(warehouseId)) {
          entries.push({
            field: ProductPriceField.PRECIO_ALMACEN,
            warehouseId,
            previousValue: prev,
            newValue: new Prisma.Decimal(0),
          });
        }
      }
    }

    if (dto.presentations) {
      const beforeMap = new Map(
        before.presentations.map((p) => [this.presentationKey(p.unitId, p.factor), p]),
      );
      const afterKeys = new Set<string>();
      for (const pr of dto.presentations) {
        const key = this.presentationKey(pr.unitId, pr.factor ?? 0);
        afterKeys.add(key);
        const prev = beforeMap.get(key);
        const p1 = Number(pr.precio1 ?? 0);
        const p2 = Number(pr.precio2 ?? 0);
        const p3 = Number(pr.precio3 ?? 0);
        this.pushDecimalChange(
          entries,
          ProductPriceField.PRESENTACION_PRECIO_1,
          prev?.precio1 ?? null,
          new Prisma.Decimal(p1),
          key,
        );
        this.pushDecimalChange(
          entries,
          ProductPriceField.PRESENTACION_PRECIO_2,
          prev?.precio2 ?? null,
          new Prisma.Decimal(p2),
          key,
        );
        this.pushDecimalChange(
          entries,
          ProductPriceField.PRESENTACION_PRECIO_3,
          prev?.precio3 ?? null,
          new Prisma.Decimal(p3),
          key,
        );
      }
      for (const [key, prev] of beforeMap) {
        if (!afterKeys.has(key)) {
          for (const field of [
            ProductPriceField.PRESENTACION_PRECIO_1,
            ProductPriceField.PRESENTACION_PRECIO_2,
            ProductPriceField.PRESENTACION_PRECIO_3,
          ]) {
            const val =
              field === ProductPriceField.PRESENTACION_PRECIO_1
                ? prev.precio1
                : field === ProductPriceField.PRESENTACION_PRECIO_2
                  ? prev.precio2
                  : prev.precio3;
            if (val && !val.isZero()) {
              entries.push({
                field,
                presentationKey: key,
                previousValue: val,
                newValue: new Prisma.Decimal(0),
              });
            }
          }
        }
      }
    }

    await this.persist(tx, productId, entries, actorId, source);
  }

  async recordImportPrices(
    productId: string,
    before: ProductPriceSnapshot | null,
    precioVenta: number,
    precioCompra: number | null,
    actorId?: string,
  ) {
    const entries: HistoryEntry[] = [];
    const venta = new Prisma.Decimal(precioVenta);
    const compra = precioCompra !== null ? new Prisma.Decimal(precioCompra) : null;

    if (!before) {
      entries.push({
        field: ProductPriceField.PRECIO_VENTA,
        previousValue: null,
        newValue: venta,
      });
      if (compra !== null) {
        entries.push({
          field: ProductPriceField.PRECIO_COMPRA,
          previousValue: null,
          newValue: compra,
        });
      }
    } else {
      this.pushDecimalChange(entries, ProductPriceField.PRECIO_VENTA, before.precioUnitarioVenta, venta);
      this.pushNullableDecimalChange(
        entries,
        ProductPriceField.PRECIO_COMPRA,
        before.precioUnitarioCompra,
        compra,
      );
    }

    if (!entries.length) return;

    await this.prisma.$transaction(async (tx) => {
      await this.persist(tx, productId, entries, actorId, ProductPriceChangeSource.IMPORT);
    });
  }

  private async persist(
    tx: Tx,
    productId: string,
    entries: HistoryEntry[],
    actorId: string | undefined,
    source: ProductPriceChangeSource,
  ) {
    if (!entries.length) return;
    await tx.productPriceHistory.createMany({
      data: entries.map((e) => ({
        productId,
        field: e.field,
        warehouseId: e.warehouseId ?? null,
        presentationKey: e.presentationKey ?? null,
        previousValue: e.previousValue,
        newValue: e.newValue,
        changedById: actorId ?? null,
        source,
      })),
    });
  }

  private pushDecimalChange(
    entries: HistoryEntry[],
    field: ProductPriceField,
    previous: Prisma.Decimal | null | undefined,
    next: Prisma.Decimal,
    presentationKey?: string,
  ) {
    const prev = previous ?? null;
    if (this.decimalsEqual(prev, next)) return;
    entries.push({
      field,
      presentationKey,
      previousValue: prev,
      newValue: next,
    });
  }

  private pushNullableDecimalChange(
    entries: HistoryEntry[],
    field: ProductPriceField,
    previous: Prisma.Decimal | null,
    next: Prisma.Decimal | null,
  ) {
    if (previous === null && next === null) return;
    if (previous !== null && next !== null && this.decimalsEqual(previous, next)) return;
    if (previous === null && next !== null) {
      entries.push({ field, previousValue: null, newValue: next });
      return;
    }
    if (previous !== null && next === null) {
      entries.push({ field, previousValue: previous, newValue: new Prisma.Decimal(0) });
      return;
    }
    if (previous !== null && next !== null) {
      entries.push({ field, previousValue: previous, newValue: next });
    }
  }

  private decimalsEqual(a: Prisma.Decimal | null, b: Prisma.Decimal | null): boolean {
    if (a === null && b === null) return true;
    if (a === null || b === null) return false;
    return a.equals(b);
  }

  private presentationKey(unitId: string, factor: number | Prisma.Decimal): string {
    const f = typeof factor === 'number' ? factor : factor.toNumber();
    return `${unitId}:${f}`;
  }
}
