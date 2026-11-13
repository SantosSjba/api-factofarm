import { textSearchFilter } from '../../../common/utils/text-search-filter';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';
import { EntityIntegrityService } from '../../../common/services/entity-integrity.service';
import {
  actorFromJwt,
  requireTenantId,
  tenantWhere,
} from '../../../common/scoping/tenant-scope.util';
import type { JwtRequestUser } from '../../auth/domain/auth.types';

@Injectable()
export class RegulatedPriceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly integrity: EntityIntegrityService,
  ) {}

  /** Cada cliente administra su propio catálogo. */
  /**
   * Condición de cada estado, con la misma regla que la pantalla y el control de venta:
   * sin código → no se compara; vencido → ya pasó su fecha final; vigente → sin fechas o ya
   * empezó; no vigente → el resto (aún no empieza o tiene fin sin inicio).
   */
  private estadoWhere(estado: string, now = new Date()): Prisma.RegulatedDrugPriceWhereInput | null {
    const sinCodigo: Prisma.RegulatedDrugPriceWhereInput = { OR: [{ codigoDigemid: null }, { codigoDigemid: '' }] };
    const conCodigo: Prisma.RegulatedDrugPriceWhereInput = { NOT: sinCodigo };
    const vencido: Prisma.RegulatedDrugPriceWhereInput = { vigenteHasta: { lt: now } };
    const vigente: Prisma.RegulatedDrugPriceWhereInput = {
      AND: [
        { OR: [{ vigenteHasta: null }, { vigenteHasta: { gte: now } }] },
        { OR: [{ vigenteDesde: null, vigenteHasta: null }, { vigenteDesde: { lte: now } }] },
      ],
    };
    switch (estado) {
      case 'sin_codigo':
        return sinCodigo;
      case 'vencido':
        return { AND: [conCodigo, vencido] };
      case 'vigente':
        return { AND: [conCodigo, vigente] };
      case 'no_vigente':
        return { AND: [conCodigo, { NOT: vencido }, { NOT: vigente }] };
      default:
        return null;
    }
  }

  /** Conteos de todo el catálogo de la empresa (el listado trae como máximo 500 filas). */
  async summary(actor: JwtRequestUser) {
    const base: Prisma.RegulatedDrugPriceWhereInput = { ...tenantWhere(actorFromJwt(actor)), deletedAt: null, activo: true };
    const now = new Date();
    const count = (estado: string) => this.prisma.regulatedDrugPrice.count({ where: { AND: [base, this.estadoWhere(estado, now)!] } });
    const [total, vigente, vencido, noVigente, sinCodigo] = await Promise.all([
      this.prisma.regulatedDrugPrice.count({ where: base }),
      count('vigente'),
      count('vencido'),
      count('no_vigente'),
      count('sin_codigo'),
    ]);
    return { total, vigente, vencido, noVigente, sinCodigo };
  }

  async list(actor: JwtRequestUser, search?: string, estado?: string) {
    const q = search?.trim();
    const estadoFilter = estado ? this.estadoWhere(estado) : null;
    return this.prisma.regulatedDrugPrice.findMany({
      where: {
        ...tenantWhere(actorFromJwt(actor)),
        deletedAt: null,
        activo: true,
        ...(estadoFilter ? { AND: [estadoFilter] } : {}),
        ...(q
          ? {
              OR: [
                { nombre: textSearchFilter(q) },
                { codigoDigemid: textSearchFilter(q) },
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
    actor: JwtRequestUser,
  ) {
    const tenantId = requireTenantId(actorFromJwt(actor));
    const codigo = dto.codigoDigemid?.trim() || null;
    const existing = codigo
      ? await this.prisma.regulatedDrugPrice.findFirst({
          where: { tenantId, codigoDigemid: codigo, deletedAt: null },
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
      ? await this.prisma.regulatedDrugPrice.update({
          where: { id: existing.id },
          data,
        })
      : await this.prisma.regulatedDrugPrice.create({
          data: { ...data, tenantId },
        });

    await this.audit.log({
      userId: actor.sub,
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
    actor: JwtRequestUser,
  ) {
    let imported = 0;
    for (const row of rows) {
      if (!row.nombre?.trim() || row.precioMaximo == null) continue;
      await this.upsert(row, actor);
      imported += 1;
    }
    return { imported, total: rows.length };
  }

  /** Precio máximo DIGEMID vigente para un código, o null si no está regulado. */
  async findActiveRegulated(
    tenantId: string,
    codigoDigemid: string,
    now: Date = new Date(),
  ) {
    return this.prisma.regulatedDrugPrice.findFirst({
      where: {
        tenantId,
        codigoDigemid,
        deletedAt: null,
        activo: true,
        OR: [
          { vigenteDesde: null, vigenteHasta: null },
          { vigenteDesde: { lte: now }, vigenteHasta: { gte: now } },
          { vigenteDesde: { lte: now }, vigenteHasta: null },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async checkSalePrices(
    establishmentId: string,
    items: Array<{ productId: string; precioUnitario: Prisma.Decimal }>,
  ) {
    const establishment = await this.prisma.establishment.findFirst({
      where: { id: establishmentId, deletedAt: null },
      select: { blockSalesAboveRegulatedPrice: true, tenantId: true },
    });
    if (!establishment) return { violations: [], blocked: false };

    const products = await this.prisma.product.findMany({
      where: {
        id: { in: items.map((i) => i.productId) },
        tenantId: establishment.tenantId,
        deletedAt: null,
      },
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

      const regulated = await this.findActiveRegulated(
        establishment.tenantId,
        codigo,
        now,
      );
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

  async remove(id: string, actor: JwtRequestUser) {
    const tenantId = requireTenantId(actorFromJwt(actor));
    const row = await this.prisma.regulatedDrugPrice.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!row) throw new NotFoundException('Precio regulado no encontrado');
    await this.integrity.assertCanDeleteRegulatedPrice(id);
    await this.prisma.regulatedDrugPrice.update({
      where: { id },
      data: { deletedAt: new Date(), activo: false },
    });
    await this.audit.log({
      userId: actor.sub,
      action: 'DELETE',
      entity: 'RegulatedDrugPrice',
      entityId: id,
    });
    return { ok: true };
  }
}
