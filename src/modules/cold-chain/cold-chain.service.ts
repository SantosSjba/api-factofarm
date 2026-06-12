import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { AuditLogService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTemperatureLogDto } from './dto/create-temperature-log.dto';

@Injectable()
export class ColdChainService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  async listByZone(warehouseZoneId: string) {
    const rows = await this.prisma.coldChainTemperatureLog.findMany({
      where: { warehouseZoneId },
      orderBy: { fecha: 'desc' },
      take: 100,
      select: {
        id: true,
        fecha: true,
        temperaturaCelsius: true,
        observacion: true,
        user: { select: { nombre: true } },
      },
    });
    return rows.map((row) => ({
      ...row,
      fecha: row.fecha.toISOString(),
      temperaturaCelsius: row.temperaturaCelsius.toString(),
    }));
  }

  async create(dto: CreateTemperatureLogDto, actorId?: string) {
    const zone = await this.prisma.warehouseZone.findFirst({
      where: { id: dto.warehouseZoneId, deletedAt: null, activo: true },
      select: { id: true, tipo: true },
    });
    if (!zone) throw new NotFoundException('Zona de almacén no encontrada');
    if (zone.tipo !== 'REFRIGERADO') {
      throw new NotFoundException('La zona debe ser de tipo refrigerado para registrar temperatura');
    }

    const fecha = dto.fecha ? new Date(dto.fecha) : new Date();
    const created = await this.prisma.coldChainTemperatureLog.create({
      data: {
        warehouseZoneId: dto.warehouseZoneId,
        userId: actorId ?? null,
        fecha,
        temperaturaCelsius: new Prisma.Decimal(dto.temperaturaCelsius),
        observacion: dto.observacion?.trim() || null,
      },
      select: {
        id: true,
        fecha: true,
        temperaturaCelsius: true,
        observacion: true,
      },
    });

    await this.audit.log({
      userId: actorId,
      action: 'CREATE',
      entity: 'ColdChainTemperatureLog',
      entityId: created.id,
    });

    return {
      ...created,
      fecha: created.fecha.toISOString(),
      temperaturaCelsius: created.temperaturaCelsius.toString(),
    };
  }
}
