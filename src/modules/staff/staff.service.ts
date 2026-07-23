import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserLeaveStatus } from '../../generated/prisma/client';
import { buildPaginatedResult, paginationArgs } from '../../common/dto/pagination.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import {
  dateRangeBoundsInTimeZone,
  normalizeTimeZone,
} from '../../common/utils/timezone.util';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AttendanceListQueryDto,
  CreateLeaveDto,
  StaffProductivityQueryDto,
  UpdateLeaveStatusDto,
  UpsertCommissionRuleDto,
  UpsertWorkScheduleDto,
} from './dto/staff.dto';

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  async getWorkSchedule(userId: string, establishmentId: string) {
    await this.ensureUserInEstablishment(userId, establishmentId);
    const rows = await this.prisma.userWorkSchedule.findMany({
      where: { userId },
      orderBy: { dayOfWeek: 'asc' },
    });
    return rows;
  }

  async upsertWorkSchedule(
    userId: string,
    establishmentId: string,
    dto: UpsertWorkScheduleDto,
    actorId: string,
  ) {
    await this.ensureUserInEstablishment(userId, establishmentId);
    for (const row of dto.rows) {
      await this.prisma.userWorkSchedule.upsert({
        where: { userId_dayOfWeek: { userId, dayOfWeek: row.dayOfWeek } },
        create: {
          userId,
          dayOfWeek: row.dayOfWeek,
          startTime: row.startTime,
          endTime: row.endTime,
          activo: row.activo ?? true,
        },
        update: {
          startTime: row.startTime,
          endTime: row.endTime,
          activo: row.activo ?? true,
        },
      });
    }
    await this.audit.log({ userId: actorId, action: 'UPSERT', entity: 'UserWorkSchedule', entityId: userId });
    return this.getWorkSchedule(userId, establishmentId);
  }

  async checkIn(userId: string, establishmentId: string, notas?: string) {
    await this.ensureUserInEstablishment(userId, establishmentId);
    const open = await this.prisma.userAttendance.findFirst({
      where: { userId, establishmentId, checkOutAt: null },
      orderBy: { checkInAt: 'desc' },
    });
    if (open) throw new BadRequestException('Ya tiene una asistencia abierta');

    const row = await this.prisma.userAttendance.create({
      data: { userId, establishmentId, notas: notas?.trim() || null },
    });
    return { id: row.id, checkInAt: row.checkInAt.toISOString() };
  }

  async checkOut(userId: string, establishmentId: string) {
    await this.ensureUserInEstablishment(userId, establishmentId);
    const open = await this.prisma.userAttendance.findFirst({
      where: { userId, establishmentId, checkOutAt: null },
      orderBy: { checkInAt: 'desc' },
    });
    if (!open) throw new BadRequestException('No hay check-in activo');

    const row = await this.prisma.userAttendance.update({
      where: { id: open.id },
      data: { checkOutAt: new Date() },
    });
    return { id: row.id, checkOutAt: row.checkOutAt?.toISOString() };
  }

  async listAttendance(establishmentId: string, query: AttendanceListQueryDto) {
    const { page, pageSize, skip, take } = paginationArgs(query);
    const where: Prisma.UserAttendanceWhereInput = {
      establishmentId,
      ...(query.userId ? { userId: query.userId } : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.userAttendance.count({ where }),
      this.prisma.userAttendance.findMany({
        where,
        skip,
        take,
        orderBy: { checkInAt: 'desc' },
        include: { user: { select: { id: true, nombre: true } } },
      }),
    ]);
    return buildPaginatedResult(
      rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        user: r.user,
        checkInAt: r.checkInAt.toISOString(),
        checkOutAt: r.checkOutAt?.toISOString() ?? null,
        notas: r.notas,
      })),
      total,
      page,
      pageSize,
    );
  }

  async upsertCommissionRule(
    userId: string,
    establishmentId: string,
    dto: UpsertCommissionRuleDto,
    actorId: string,
  ) {
    await this.ensureUserInEstablishment(userId, establishmentId);
    await this.prisma.userCommissionRule.updateMany({
      where: { userId, activo: true },
      data: { activo: false },
    });
    const row = await this.prisma.userCommissionRule.create({
      data: {
        userId,
        commissionPercent: new Prisma.Decimal(dto.commissionPercent),
        activo: true,
      },
    });
    await this.audit.log({ userId: actorId, action: 'UPSERT', entity: 'UserCommissionRule', entityId: row.id });
    return { id: row.id, commissionPercent: row.commissionPercent.toString() };
  }

  async getProductivityReport(establishmentId: string, query: StaffProductivityQueryDto) {
    const fromYmd = this.toYmd(query.from);
    const toYmd = this.toYmd(query.to);
    if (!fromYmd || !toYmd) {
      throw new BadRequestException('Rango de fechas inválido');
    }
    const tz = await this.resolveTimeZone(establishmentId);
    const { start: from, end: to } = dateRangeBoundsInTimeZone(fromYmd, toYmd, tz);

    const sellers = await this.prisma.user.findMany({
      where: { establecimientoId: establishmentId, deletedAt: null },
      select: { id: true, nombre: true, role: true },
    });

    const rows = await Promise.all(
      sellers.map(async (seller) => {
        const salesAgg = await this.prisma.sale.aggregate({
          where: {
            establishmentId,
            sellerId: seller.id,
            deletedAt: null,
            estado: 'COMPLETADA',
            createdAt: { gte: from, lt: to },
          },
          _sum: { total: true },
          _count: true,
        });
        const rule = await this.prisma.userCommissionRule.findFirst({
          where: { userId: seller.id, activo: true },
          select: { commissionPercent: true },
        });
        const ventasTotal = salesAgg._sum.total ?? new Prisma.Decimal(0);
        const commissionPercent = rule?.commissionPercent ?? new Prisma.Decimal(0);
        const comision = ventasTotal.times(commissionPercent).div(100);

        return {
          userId: seller.id,
          nombre: seller.nombre,
          role: seller.role,
          ventasCount: salesAgg._count,
          ventasTotal: ventasTotal.toString(),
          commissionPercent: commissionPercent.toString(),
          comisionEstimada: comision.toString(),
        };
      }),
    );

    return { from: from.toISOString(), to: to.toISOString(), employees: rows };
  }

  async createLeave(userId: string, establishmentId: string, dto: CreateLeaveDto, actorId: string) {
    await this.ensureUserInEstablishment(userId, establishmentId);
    const fromYmd = this.toYmd(dto.fromDate);
    const toYmd = this.toYmd(dto.toDate);
    if (!fromYmd || !toYmd) {
      throw new BadRequestException('Fechas inválidas');
    }
    const tz = await this.resolveTimeZone(establishmentId);
    const fromDate = dateRangeBoundsInTimeZone(fromYmd, fromYmd, tz).start;
    const toDate = dateRangeBoundsInTimeZone(toYmd, toYmd, tz).start;

    const row = await this.prisma.userLeave.create({
      data: {
        userId,
        tipo: dto.tipo,
        fromDate,
        toDate,
        notas: dto.notas?.trim() || null,
      },
    });
    await this.audit.log({ userId: actorId, action: 'CREATE', entity: 'UserLeave', entityId: row.id });
    return { id: row.id, estado: row.estado };
  }

  async updateLeaveStatus(
    leaveId: string,
    establishmentId: string,
    dto: UpdateLeaveStatusDto,
    actorId: string,
  ) {
    const leave = await this.prisma.userLeave.findFirst({
      where: { id: leaveId, user: { establecimientoId: establishmentId } },
    });
    if (!leave) throw new NotFoundException('Licencia no encontrada');

    const row = await this.prisma.userLeave.update({
      where: { id: leaveId },
      data: { estado: dto.estado },
    });
    await this.audit.log({ userId: actorId, action: 'UPDATE', entity: 'UserLeave', entityId: leaveId });
    return { id: row.id, estado: row.estado };
  }

  async listLeaves(establishmentId: string, userId?: string) {
    const rows = await this.prisma.userLeave.findMany({
      where: {
        user: { establecimientoId: establishmentId, deletedAt: null },
        ...(userId ? { userId } : {}),
        estado: { not: UserLeaveStatus.CANCELADO },
      },
      orderBy: { fromDate: 'desc' },
      take: 100,
      include: { user: { select: { id: true, nombre: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      tipo: r.tipo,
      estado: r.estado,
      fromDate: r.fromDate.toISOString(),
      toDate: r.toDate.toISOString(),
      notas: r.notas,
      user: r.user,
    }));
  }

  private async ensureUserInEstablishment(userId: string, establishmentId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, establecimientoId: establishmentId, deletedAt: null },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado en esta sucursal');
  }

  private toYmd(value?: string): string | null {
    const m = /^(\d{4}-\d{2}-\d{2})/.exec(value?.trim() ?? '');
    return m?.[1] ?? null;
  }

  private async resolveTimeZone(establishmentId: string): Promise<string> {
    const row = await this.prisma.establishment.findFirst({
      where: { id: establishmentId, deletedAt: null },
      select: { timeZone: true },
    });
    return normalizeTimeZone(row?.timeZone);
  }
}
