import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';

@Injectable()
export class RegulatedPriceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  async list(search?: string) {
    const q = search?.trim();
    return this.prisma.regulatedDrugPrice.findMany({
      where: {
        deletedAt: null,
        activo: true,
        ...(q
          ? {
              OR: [
                { nombre: { contains: q, mode: 'insensitive' } },
                { codigoDigemid: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { nombre: 'asc' },
      take: 500,
    });
  }

  async upsert(
    dto: {
      codigoDigemid?: string;
      nombre: string;
      precioMaximo: number;
      vigenteDesde?: string;
      vigenteHasta?: string;
      fuente?: string;
    },
    actorId?: string,
  ) {
    const codigo = dto.codigoDigemid?.trim() || null;
    const existing = codigo
      ? await this.prisma.regulatedDrugPrice.findFirst({
          where: { codigoDigemid: codigo, deletedAt: null },
        })
      : null;

    const data = {
      codigoDigemid: codigo,
      nombre: dto.nombre.trim(),
      precioMaximo: new Prisma.Decimal(dto.precioMaximo),
      vigenteDesde: dto.vigenteDesde ? new Date(dto.vigenteDesde) : null,
      vigenteHasta: dto.vigenteHasta ? new Date(dto.vigenteHasta) : null,
      fuente: dto.fuente?.trim() || 'DIGEMED',
      activo: true,
    };

    const row = existing
      ? await this.prisma.regulatedDrugPrice.update({ where: { id: existing.id }, data })
      : await this.prisma.regulatedDrugPrice.create({ data });

    await this.audit.log({
      userId: actorId,
      action: existing ? 'UPDATE' : 'CREATE',
      entity: 'RegulatedDrugPrice',
      entityId: row.id,
      diff: dto,
    });
    return row;
  }

  async importBatch(
    rows: Array<{
      codigoDigemid?: string;
      nombre: string;
      precioMaximo: number;
    }>,
    actorId?: string,
  ) {
    let imported = 0;
    for (const row of rows) {
      if (!row.nombre?.trim() || row.precioMaximo == null) continue;
      await this.upsert(row, actorId);
      imported += 1;
    }
    return { imported, total: rows.length };
  }

  async checkSalePrices(
    establishmentId: string,
    items: Array<{ productId: string; precioUnitario: Prisma.Decimal }>,
  ) {
    const establishment = await this.prisma.establishment.findFirst({
      where: { id: establishmentId, deletedAt: null },
      select: { blockSalesAboveRegulatedPrice: true },
    });
    if (!establishment) return { violations: [], blocked: false };

    const products = await this.prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) }, deletedAt: null },
      select: {
        id: true,
        nombre: true,
        codigoMedicamentoDigemid: true,
        precioUnitarioVenta: true,
      },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    const violations: Array<{
      productId: string;
      nombre: string;
      precioVenta: string;
      precioMaximo: string;
      codigoDigemid: string | null;
    }> = [];

    const now = new Date();
    for (const item of items) {
      const product = byId.get(item.productId);
      if (!product) continue;
      const codigo = product.codigoMedicamentoDigemid?.trim();
      if (!codigo) continue;

      const regulated = await this.prisma.regulatedDrugPrice.findFirst({
        where: {
          codigoDigemid: codigo,
          deletedAt: null,
          activo: true,
          OR: [
            { vigenteDesde: null, vigenteHasta: null },
            {
              vigenteDesde: { lte: now },
              vigenteHasta: { gte: now },
            },
            { vigenteDesde: { lte: now }, vigenteHasta: null },
          ],
        },
        orderBy: { updatedAt: 'desc' },
      });
      if (!regulated) continue;

      const max = new Prisma.Decimal(regulated.precioMaximo.toString());
      if (item.precioUnitario.greaterThan(max)) {
        violations.push({
          productId: product.id,
          nombre: product.nombre,
          precioVenta: item.precioUnitario.toString(),
          precioMaximo: max.toString(),
          codigoDigemid: codigo,
        });
      }
    }

    if (violations.length > 0 && establishment.blockSalesAboveRegulatedPrice) {
      throw new BadRequestException({
        message: 'Precio de venta excede el máximo regulado DIGEMED',
        violations,
      });
    }

    return { violations, blocked: establishment.blockSalesAboveRegulatedPrice };
  }

  async remove(id: string, actorId?: string) {
    const row = await this.prisma.regulatedDrugPrice.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!row) throw new NotFoundException('Precio regulado no encontrado');
    await this.prisma.regulatedDrugPrice.update({
      where: { id },
      data: { deletedAt: new Date(), activo: false },
    });
    await this.audit.log({
      userId: actorId,
      action: 'DELETE',
      entity: 'RegulatedDrugPrice',
      entityId: id,
    });
    return { ok: true };
  }
}
