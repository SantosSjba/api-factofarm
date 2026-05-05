import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductSerialStatus } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import * as XLSX from 'xlsx';
import { CreateInboundMovementDto } from './dto/create-inbound-movement.dto';
import { CreateOutboundMovementDto } from './dto/create-outbound-movement.dto';
import { ImportInventoryFileDto } from './dto/import-inventory-file.dto';
import { InventoryMovementListQueryDto } from './dto/inventory-movement-list-query.dto';
import { InventoryImportTemplateMode } from './dto/inventory-import-template-query.dto';
import { LotCodeSearchQueryDto } from './dto/lot-code-search-query.dto';

const serialAvailableStates: ProductSerialStatus[] = [
  ProductSerialStatus.DISPONIBLE,
  ProductSerialStatus.RESERVADO,
];

@Injectable()
export class InventoryMovementsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: InventoryMovementListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const search = query.search?.trim();
    const field = query.field ?? 'producto';
    const or: Prisma.ProductWarehouseStockWhereInput[] = [];
    if (search) {
      if (field === 'all' || field === 'producto') {
        or.push({ product: { nombre: { contains: search, mode: 'insensitive' } } });
      }
      if (field === 'all' || field === 'marca') {
        or.push({ product: { brand: { nombre: { contains: search, mode: 'insensitive' } } } });
      }
      if (field === 'all' || field === 'almacen') {
        or.push({ warehouse: { nombre: { contains: search, mode: 'insensitive' } } });
      }
    }
    const where: Prisma.ProductWarehouseStockWhereInput = {
      product: { deletedAt: null },
      warehouse: { deletedAt: null },
      ...(or.length ? { OR: or } : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.productWarehouseStock.count({ where }),
      this.prisma.productWarehouseStock.findMany({
        where,
        orderBy: [{ product: { nombre: 'asc' } }, { warehouse: { nombre: 'asc' } }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          cantidad: true,
          product: {
            select: {
              id: true,
              nombre: true,
              codigoInterno: true,
              brand: { select: { nombre: true } },
            },
          },
          warehouse: {
            select: {
              id: true,
              nombre: true,
              establishment: { select: { nombre: true } },
            },
          },
        },
      }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        productId: row.product.id,
        producto: row.product.nombre,
        codigoInterno: row.product.codigoInterno ?? null,
        marca: row.product.brand?.nombre ?? '—',
        almacen: row.warehouse.nombre,
        stock: row.cantidad.toString(),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  listWarehouses() {
    return this.prisma.warehouse.findMany({
      where: { deletedAt: null },
      orderBy: [{ establishmentId: 'asc' }, { nombre: 'asc' }],
      select: {
        id: true,
        nombre: true,
        establishment: { select: { id: true, nombre: true, codigo: true } },
      },
    });
  }

  listTransferReasons() {
    return this.prisma.inventoryTransferReason.findMany({
      where: { deletedAt: null, activo: true, codigo: { not: { startsWith: 'OUT_' } } },
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        codigo: true,
        nombre: true,
      },
    });
  }

  listOutputReasons() {
    return this.prisma.inventoryTransferReason.findMany({
      where: { deletedAt: null, activo: true, codigo: { startsWith: 'OUT_' } },
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        codigo: true,
        nombre: true,
      },
    });
  }

  async searchLotCodes(query: LotCodeSearchQueryDto) {
    const mode = query.mode ?? 'INBOUND';
    const search = query.search?.trim();
    const rows = await this.prisma.productLotStock.findMany({
      where: {
        productId: query.productId,
        warehouseId: query.warehouseId,
        deletedAt: null,
        ...(search ? { codigoLote: { contains: search, mode: 'insensitive' } } : {}),
        ...(mode === 'OUTBOUND' ? { stock: { gt: new Prisma.Decimal(0) } } : {}),
      },
      orderBy: [{ codigoLote: 'asc' }],
      take: 20,
      select: {
        id: true,
        codigoLote: true,
        stock: true,
        fechaVencimiento: true,
      },
    });
    return rows.map((row) => ({
      id: row.id,
      codigoLote: row.codigoLote,
      stock: row.stock.toString(),
      fechaVencimiento: row.fechaVencimiento?.toISOString() ?? null,
    }));
  }

  async createInboundMovement(dto: CreateInboundMovementDto) {
    const [product, warehouse, transferReason] = await Promise.all([
      this.prisma.product.findFirst({
        where: { id: dto.productId, deletedAt: null },
        select: { id: true, nombre: true },
      }),
      this.prisma.warehouse.findFirst({
        where: { id: dto.warehouseId, deletedAt: null },
        select: { id: true, nombre: true },
      }),
      this.prisma.inventoryTransferReason.findFirst({
        where: { id: dto.transferReasonId, deletedAt: null, activo: true },
        select: { id: true, nombre: true },
      }),
    ]);
    if (!product) throw new NotFoundException('Producto no encontrado');
    if (!warehouse) throw new NotFoundException('Almacén no encontrado');
    if (!transferReason) throw new NotFoundException('Motivo de traslado no encontrado');

    const amount = new Prisma.Decimal(dto.quantity);
    const fechaVencimiento = dto.expirationDate ? new Date(dto.expirationDate) : null;
    const fechaRegistro = dto.registeredAt ? new Date(dto.registeredAt) : new Date();
    if (Number.isNaN(fechaRegistro.getTime())) {
      throw new BadRequestException('Fecha de registro inválida');
    }
    if (fechaVencimiento && Number.isNaN(fechaVencimiento.getTime())) {
      throw new BadRequestException('Fecha de vencimiento inválida');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.inventoryInboundMovement.create({
        data: {
          productId: product.id,
          warehouseId: warehouse.id,
          transferReasonId: transferReason.id,
          cantidad: amount,
          codigoLote: dto.lotCode || null,
          fechaVencimiento,
          fechaRegistro,
          comentario: dto.comment || null,
        },
      });

      if (dto.lotCode) {
        const existingLot = await tx.productLotStock.findFirst({
          where: {
            productId: product.id,
            warehouseId: warehouse.id,
            codigoLote: dto.lotCode,
            deletedAt: null,
          },
          select: { id: true, stock: true },
        });
        if (existingLot) {
          await tx.productLotStock.update({
            where: { id: existingLot.id },
            data: {
              stock: existingLot.stock.plus(amount),
              fechaVencimiento: fechaVencimiento ?? undefined,
            },
          });
        } else {
          await tx.productLotStock.create({
            data: {
              productId: product.id,
              warehouseId: warehouse.id,
              codigoLote: dto.lotCode,
              stock: amount,
              fechaVencimiento,
            },
          });
        }
      }

      const current = await tx.productWarehouseStock.findUnique({
        where: {
          productId_warehouseId: {
            productId: product.id,
            warehouseId: warehouse.id,
          },
        },
        select: { cantidad: true },
      });
      await tx.productWarehouseStock.upsert({
        where: {
          productId_warehouseId: {
            productId: product.id,
            warehouseId: warehouse.id,
          },
        },
        update: { cantidad: (current?.cantidad ?? new Prisma.Decimal(0)).plus(amount) },
        create: {
          productId: product.id,
          warehouseId: warehouse.id,
          cantidad: amount,
        },
      });
    });

    return {
      ok: true,
      message: 'Ingreso registrado correctamente',
    };
  }

  async createOutboundMovement(dto: CreateOutboundMovementDto) {
    const [product, warehouse, transferReason, currentStock] = await Promise.all([
      this.prisma.product.findFirst({
        where: { id: dto.productId, deletedAt: null },
        select: { id: true, nombre: true },
      }),
      this.prisma.warehouse.findFirst({
        where: { id: dto.warehouseId, deletedAt: null },
        select: { id: true, nombre: true },
      }),
      this.prisma.inventoryTransferReason.findFirst({
        where: {
          id: dto.transferReasonId,
          deletedAt: null,
          activo: true,
          codigo: { startsWith: 'OUT_' },
        },
        select: { id: true, nombre: true },
      }),
      this.prisma.productWarehouseStock.findUnique({
        where: {
          productId_warehouseId: {
            productId: dto.productId,
            warehouseId: dto.warehouseId,
          },
        },
        select: { cantidad: true },
      }),
    ]);
    if (!product) throw new NotFoundException('Producto no encontrado');
    if (!warehouse) throw new NotFoundException('Almacén no encontrado');
    if (!transferReason) throw new NotFoundException('Motivo de salida no encontrado');

    const amount = new Prisma.Decimal(dto.quantity);
    const current = currentStock?.cantidad ?? new Prisma.Decimal(0);
    if (current.lessThan(amount)) {
      throw new BadRequestException('Stock insuficiente para realizar la salida');
    }
    const fechaRegistro = dto.registeredAt ? new Date(dto.registeredAt) : new Date();
    if (Number.isNaN(fechaRegistro.getTime())) {
      throw new BadRequestException('Fecha de registro inválida');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.inventoryInboundMovement.create({
        data: {
          productId: product.id,
          warehouseId: warehouse.id,
          transferReasonId: transferReason.id,
          cantidad: amount.negated(),
          codigoLote: dto.lotCode || null,
          fechaRegistro,
          comentario: dto.comment || null,
        },
      });

      if (dto.lotCode) {
        const existingLot = await tx.productLotStock.findFirst({
          where: {
            productId: product.id,
            warehouseId: warehouse.id,
            codigoLote: dto.lotCode,
            deletedAt: null,
          },
          select: { id: true, stock: true },
        });
        if (!existingLot) {
          throw new BadRequestException('No existe el lote indicado en el almacén seleccionado');
        }
        if (existingLot.stock.lessThan(amount)) {
          throw new BadRequestException('Stock insuficiente en el lote indicado');
        }
        await tx.productLotStock.update({
          where: { id: existingLot.id },
          data: { stock: existingLot.stock.minus(amount) },
        });
      }

      await tx.productWarehouseStock.upsert({
        where: {
          productId_warehouseId: {
            productId: product.id,
            warehouseId: warehouse.id,
          },
        },
        update: { cantidad: current.minus(amount) },
        create: {
          productId: product.id,
          warehouseId: warehouse.id,
          cantidad: new Prisma.Decimal(0),
        },
      });
    });

    return {
      ok: true,
      message: 'Salida registrada correctamente',
    };
  }

  async importLots(dto: ImportInventoryFileDto, file: Express.Multer.File) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, deletedAt: null },
      select: { id: true },
    });
    if (!warehouse) throw new NotFoundException('Almacén no encontrado');
    const rows = this.readRows(file);

    let created = 0;
    let updated = 0;
    const errors: string[] = [];
    const touched = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const displayRow = i + 2;
      const codigoInterno = this.cellString(row, 'Código Interno');
      const codigoLote = this.cellString(row, 'Código Lote');
      const stock = this.toNumber(row['Stock']);
      const fechaVenc = this.toDate(row['Fec. Vencimiento']);

      if (!codigoInterno && !codigoLote && stock === null) continue;
      if (!codigoInterno || !codigoLote || stock === null || stock < 0) {
        errors.push(`Fila ${displayRow}: faltan campos obligatorios o stock inválido.`);
        continue;
      }

      try {
        const product = await this.prisma.product.findFirst({
          where: { codigoInterno, deletedAt: null },
          select: { id: true },
        });
        if (!product) throw new BadRequestException(`Producto no encontrado (${codigoInterno})`);

        const existing = await this.prisma.productLotStock.findFirst({
          where: { productId: product.id, warehouseId: warehouse.id, codigoLote, deletedAt: null },
          select: { id: true },
        });

        if (existing) {
          await this.prisma.productLotStock.update({
            where: { id: existing.id },
            data: {
              stock: new Prisma.Decimal(stock),
              fechaVencimiento: fechaVenc,
            },
          });
          updated += 1;
        } else {
          await this.prisma.productLotStock.create({
            data: {
              productId: product.id,
              warehouseId: warehouse.id,
              codigoLote,
              stock: new Prisma.Decimal(stock),
              fechaVencimiento: fechaVenc,
            },
          });
          created += 1;
        }

        await this.prisma.product.update({
          where: { id: product.id },
          data: { manejaLotes: true },
        });
        touched.add(product.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error no identificado';
        errors.push(`Fila ${displayRow}: ${message}`);
      }
    }

    for (const productId of touched) {
      await this.recalculateStock(productId, warehouse.id);
    }

    return { totalRows: rows.length, created, updated, errors };
  }

  async importSeries(dto: ImportInventoryFileDto, file: Express.Multer.File) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, deletedAt: null },
      select: { id: true },
    });
    if (!warehouse) throw new NotFoundException('Almacén no encontrado');
    const rows = this.readRows(file);

    let created = 0;
    let updated = 0;
    const errors: string[] = [];
    const touched = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const displayRow = i + 2;
      const codigoInterno = this.cellString(row, 'Código Interno');
      const serie = this.cellString(row, 'Serie');
      const estadoRaw = this.cellString(row, 'Estado');
      const fecha = this.toDate(row['Fecha']);

      if (!codigoInterno && !serie && !estadoRaw) continue;
      if (!codigoInterno || !serie) {
        errors.push(`Fila ${displayRow}: faltan campos obligatorios.`);
        continue;
      }

      try {
        const product = await this.prisma.product.findFirst({
          where: { codigoInterno, deletedAt: null },
          select: { id: true },
        });
        if (!product) throw new BadRequestException(`Producto no encontrado (${codigoInterno})`);

        const { estado, vendido } = this.mapEstado(estadoRaw);
        const existing = await this.prisma.productSerial.findFirst({
          where: { warehouseId: warehouse.id, serie, deletedAt: null },
          select: { id: true },
        });

        if (existing) {
          await this.prisma.productSerial.update({
            where: { id: existing.id },
            data: {
              productId: product.id,
              fecha: fecha ?? undefined,
              estado,
              vendido,
              soldAt: vendido ? new Date() : null,
            },
          });
          updated += 1;
        } else {
          await this.prisma.productSerial.create({
            data: {
              productId: product.id,
              warehouseId: warehouse.id,
              serie,
              fecha: fecha ?? undefined,
              estado,
              vendido,
              soldAt: vendido ? new Date() : null,
            },
          });
          created += 1;
        }

        touched.add(product.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error no identificado';
        errors.push(`Fila ${displayRow}: ${message}`);
      }
    }

    for (const productId of touched) {
      await this.recalculateStock(productId, warehouse.id);
    }

    return { totalRows: rows.length, created, updated, errors };
  }

  buildImportTemplateBuffer(mode: InventoryImportTemplateMode) {
    const workbook = XLSX.utils.book_new();
    const rows =
      mode === 'SERIES'
        ? [
            {
              'Código Interno': 'SERBI001',
              Serie: 'SERPXAB1',
              Estado: 'Activo',
              Fecha: '12/10/2023',
            },
          ]
        : [
            {
              'Código Interno': 'BI001',
              'Código Lote': 'LOTZBC001',
              Stock: 40,
              'Fec. Vencimiento': '12/10/2023',
            },
          ];
    const sheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Hoja1');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  private readRows(file: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Archivo no válido para importar');
    }
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const first = workbook.SheetNames[0];
    const sheet = workbook.Sheets[first];
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  }

  private async recalculateStock(productId: string, warehouseId: string) {
    const [lots, serialCount] = await Promise.all([
      this.prisma.productLotStock.findMany({
        where: { productId, warehouseId, deletedAt: null },
        select: { stock: true },
      }),
      this.prisma.productSerial.count({
        where: { productId, warehouseId, deletedAt: null, estado: { in: serialAvailableStates } },
      }),
    ]);
    const lotTotal = lots.reduce((acc, row) => acc.plus(row.stock), new Prisma.Decimal(0));
    const total = lotTotal.plus(serialCount);

    await this.prisma.productWarehouseStock.upsert({
      where: {
        productId_warehouseId: {
          productId,
          warehouseId,
        },
      },
      update: { cantidad: total },
      create: {
        productId,
        warehouseId,
        cantidad: total,
      },
    });
  }

  private mapEstado(value: string): { estado: ProductSerialStatus; vendido: boolean } {
    const key = value.trim().toUpperCase();
    if (!key) return { estado: ProductSerialStatus.DISPONIBLE, vendido: false };
    if (key.includes('ACT')) return { estado: ProductSerialStatus.DISPONIBLE, vendido: false };
    if (key.includes('INACT')) return { estado: ProductSerialStatus.ANULADO, vendido: false };
    if (key.includes('VEND')) return { estado: ProductSerialStatus.VENDIDO, vendido: true };
    if (key.includes('RES')) return { estado: ProductSerialStatus.RESERVADO, vendido: false };
    return { estado: ProductSerialStatus.DISPONIBLE, vendido: false };
  }

  private cellString(row: Record<string, unknown>, key: string): string {
    const value = row[key];
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  private toNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    const normalized = String(value).replace(',', '.').trim();
    if (!normalized) return null;
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private toDate(value: unknown): Date | null {
    if (value === null || value === undefined || value === '') return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    if (typeof value === 'number') {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (!parsed) return null;
      return new Date(parsed.y, parsed.m - 1, parsed.d);
    }
    const text = String(value).trim();
    if (!text) return null;
    const [a, b, c] = text.split(/[\/\-]/).map((x) => Number.parseInt(x, 10));
    if (!a || !b || !c) {
      const fallback = new Date(text);
      return Number.isNaN(fallback.getTime()) ? null : fallback;
    }
    if (text.includes('/')) return new Date(c, b - 1, a);
    return new Date(a, b - 1, c);
  }
}
