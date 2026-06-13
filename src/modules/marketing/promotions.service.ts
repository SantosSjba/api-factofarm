import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PromotionType } from '../../generated/prisma/client';
import { buildPaginatedResult, paginationArgs } from '../../common/dto/pagination.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePromotionDto,
  PromotionListQueryDto,
  UpdatePromotionDto,
} from './dto/marketing.dto';

@Injectable()
export class PromotionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  async findAll(establishmentId: string, query: PromotionListQueryDto) {
    const { page, pageSize, skip, take } = paginationArgs(query);
    const search = query.search?.trim();
    const where: Prisma.PromotionWhereInput = {
      establishmentId,
      deletedAt: null,
      ...(query.activo !== undefined ? { activo: query.activo } : {}),
      ...(search
        ? {
            OR: [
              { codigo: { contains: search, mode: 'insensitive' } },
              { nombre: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.promotion.count({ where }),
      this.prisma.promotion.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return buildPaginatedResult(
      rows.map((r) => ({
        id: r.id,
        codigo: r.codigo,
        nombre: r.nombre,
        tipo: r.tipo,
        valor: r.valor.toString(),
        cantidadMinima: r.cantidadMinima,
        activo: r.activo,
        validFrom: r.validFrom?.toISOString() ?? null,
        validTo: r.validTo?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    );
  }

  async findOne(id: string, establishmentId: string) {
    const row = await this.prisma.promotion.findFirst({
      where: { id, establishmentId, deletedAt: null },
    });
    if (!row) throw new NotFoundException('Promoción no encontrada');
    return this.map(row);
  }

  async validateCode(establishmentId: string, code: string) {
    const promo = await this.findActivePromotion(establishmentId, code);
    if (!promo) return { valid: false as const, reason: 'Código no válido o vencido' };
    return {
      valid: true as const,
      promotion: this.map(promo),
    };
  }

  async recordRedemption(
    establishmentId: string,
    code: string,
    saleId: string,
    customerId?: string,
  ) {
    const promo = await this.findActivePromotion(establishmentId, code);
    if (!promo) return;
    await this.prisma.promotionRedemption.create({
      data: {
        promotionId: promo.id,
        customerId: customerId ?? null,
        saleId,
      },
    });
  }

  async create(establishmentId: string, dto: CreatePromotionDto, actorId?: string) {
    const created = await this.prisma.promotion.create({
      data: {
        establishmentId,
        codigo: dto.codigo.trim().toUpperCase(),
        nombre: dto.nombre.trim(),
        tipo: dto.tipo,
        valor: new Prisma.Decimal(dto.valor),
        cantidadMinima: dto.cantidadMinima ?? null,
        activo: dto.activo ?? true,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
        validTo: dto.validTo ? new Date(dto.validTo) : null,
      },
    });
    await this.audit.log({
      userId: actorId,
      action: 'CREATE',
      entity: 'Promotion',
      entityId: created.id,
    });
    return this.map(created);
  }

  async update(
    id: string,
    establishmentId: string,
    dto: UpdatePromotionDto,
    actorId?: string,
  ) {
    await this.ensure(id, establishmentId);
    const updated = await this.prisma.promotion.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined ? { nombre: dto.nombre.trim() } : {}),
        ...(dto.tipo !== undefined ? { tipo: dto.tipo } : {}),
        ...(dto.valor !== undefined ? { valor: new Prisma.Decimal(dto.valor) } : {}),
        ...(dto.cantidadMinima !== undefined ? { cantidadMinima: dto.cantidadMinima } : {}),
        ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
        ...(dto.validFrom !== undefined
          ? { validFrom: dto.validFrom ? new Date(dto.validFrom) : null }
          : {}),
        ...(dto.validTo !== undefined
          ? { validTo: dto.validTo ? new Date(dto.validTo) : null }
          : {}),
      },
    });
    await this.audit.log({
      userId: actorId,
      action: 'UPDATE',
      entity: 'Promotion',
      entityId: id,
    });
    return this.map(updated);
  }

  async remove(id: string, establishmentId: string, actorId?: string) {
    await this.ensure(id, establishmentId);
    await this.prisma.promotion.update({
      where: { id },
      data: { deletedAt: new Date(), activo: false },
    });
    await this.audit.log({
      userId: actorId,
      action: 'DELETE',
      entity: 'Promotion',
      entityId: id,
    });
    return { ok: true };
  }

  private async ensure(id: string, establishmentId: string) {
    const row = await this.prisma.promotion.findFirst({
      where: { id, establishmentId, deletedAt: null },
      select: { id: true },
    });
    if (!row) throw new NotFoundException('Promoción no encontrada');
  }

  private async findActivePromotion(establishmentId: string, code: string) {
    const promo = await this.prisma.promotion.findFirst({
      where: {
        establishmentId,
        codigo: code.trim().toUpperCase(),
        activo: true,
        deletedAt: null,
        OR: [{ validFrom: null }, { validFrom: { lte: new Date() } }],
      },
    });
    if (!promo) return null;
    if (promo.validTo && promo.validTo.getTime() < Date.now()) return null;
    return promo;
  }

  private map(row: {
    id: string;
    codigo: string;
    nombre: string;
    tipo: PromotionType;
    valor: Prisma.Decimal;
    cantidadMinima: number | null;
    activo: boolean;
    validFrom: Date | null;
    validTo: Date | null;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      codigo: row.codigo,
      nombre: row.nombre,
      tipo: row.tipo,
      valor: row.valor.toString(),
      cantidadMinima: row.cantidadMinima,
      activo: row.activo,
      validFrom: row.validFrom?.toISOString() ?? null,
      validTo: row.validTo?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
