import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CashMovementType, CashSessionStatus, PaymentMethod, Prisma } from '../../generated/prisma/client';
import { AuditLogService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CloseCashSessionDto,
  CreateCashMovementDto,
  CreateCashRegisterDto,
  OpenCashSessionDto,
} from './dto/cash-register.dto';

@Injectable()
export class CashRegistersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  listRegisters(establishmentId: string) {
    return this.prisma.cashRegister.findMany({
      where: { establishmentId, deletedAt: null, activo: true },
      orderBy: { nombre: 'asc' },
      select: { id: true, nombre: true, activo: true },
    });
  }

  async createRegister(establishmentId: string, dto: CreateCashRegisterDto, actorId?: string) {
    const created = await this.prisma.cashRegister.create({
      data: {
        establishmentId,
        nombre: dto.nombre.trim(),
      },
      select: { id: true, nombre: true },
    });
    await this.audit.log({
      userId: actorId,
      action: 'CREATE',
      entity: 'CashRegister',
      entityId: created.id,
    });
    return created;
  }

  async getActiveSession(establishmentId: string, userId: string) {
    return this.prisma.cashSession.findFirst({
      where: {
        userId,
        estado: CashSessionStatus.ABIERTA,
        cashRegister: { establishmentId, deletedAt: null },
      },
      select: {
        id: true,
        montoApertura: true,
        openedAt: true,
        cashRegister: { select: { id: true, nombre: true } },
      },
    });
  }

  async openSession(establishmentId: string, userId: string, dto: OpenCashSessionDto) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { id: dto.cashRegisterId, establishmentId, deletedAt: null, activo: true },
      select: { id: true },
    });
    if (!register) throw new NotFoundException('Caja no encontrada');

    const existing = await this.getActiveSession(establishmentId, userId);
    if (existing) {
      throw new BadRequestException('Ya tiene una sesión de caja abierta');
    }

    const montoApertura = new Prisma.Decimal(dto.montoApertura ?? 0);
    const session = await this.prisma.cashSession.create({
      data: {
        cashRegisterId: dto.cashRegisterId,
        userId,
        montoApertura,
        movements: {
          create: {
            tipo: CashMovementType.APERTURA,
            monto: montoApertura,
            metodoPago: PaymentMethod.EFECTIVO,
            comentario: 'Apertura de caja',
          },
        },
      },
      select: { id: true, montoApertura: true, openedAt: true },
    });

    await this.audit.log({
      userId,
      action: 'OPEN',
      entity: 'CashSession',
      entityId: session.id,
    });

    return {
      id: session.id,
      montoApertura: session.montoApertura.toString(),
      openedAt: session.openedAt.toISOString(),
    };
  }

  async closeSession(
    sessionId: string,
    establishmentId: string,
    userId: string,
    dto: CloseCashSessionDto,
  ) {
    const session = await this.prisma.cashSession.findFirst({
      where: {
        id: sessionId,
        userId,
        estado: CashSessionStatus.ABIERTA,
        cashRegister: { establishmentId },
      },
      include: { movements: true },
    });
    if (!session) throw new NotFoundException('Sesión de caja no encontrada');

    const montoSistema = session.movements.reduce(
      (acc, row) => acc.plus(row.monto),
      new Prisma.Decimal(0),
    );
    const montoFisico = new Prisma.Decimal(dto.montoCierreFisico);
    const diferencia = montoFisico.minus(montoSistema);

    await this.prisma.cashSession.update({
      where: { id: sessionId },
      data: {
        estado: CashSessionStatus.CERRADA,
        montoCierreSistema: montoSistema,
        montoCierreFisico: montoFisico,
        diferenciaArqueo: diferencia,
        notasCierre: dto.notasCierre?.trim() || null,
        closedAt: new Date(),
        movements: {
          create: {
            tipo: CashMovementType.CIERRE,
            monto: montoFisico,
            metodoPago: PaymentMethod.EFECTIVO,
            comentario: dto.notasCierre?.trim() || 'Cierre de caja',
          },
        },
      },
    });

    await this.audit.log({
      userId,
      action: 'CLOSE',
      entity: 'CashSession',
      entityId: sessionId,
    });

    return {
      ok: true,
      montoCierreSistema: montoSistema.toString(),
      montoCierreFisico: montoFisico.toString(),
      diferenciaArqueo: diferencia.toString(),
    };
  }

  async addMovement(sessionId: string, establishmentId: string, userId: string, dto: CreateCashMovementDto) {
    const session = await this.prisma.cashSession.findFirst({
      where: {
        id: sessionId,
        userId,
        estado: CashSessionStatus.ABIERTA,
        cashRegister: { establishmentId },
      },
      select: { id: true },
    });
    if (!session) throw new NotFoundException('Sesión no abierta');

    if (dto.tipo !== CashMovementType.INGRESO && dto.tipo !== CashMovementType.EGRESO) {
      throw new BadRequestException('Solo ingresos o egresos manuales en sesión abierta');
    }

    const signed =
      dto.tipo === CashMovementType.EGRESO
        ? new Prisma.Decimal(dto.monto).negated()
        : new Prisma.Decimal(dto.monto);

    await this.prisma.cashMovement.create({
      data: {
        cashSessionId: sessionId,
        tipo: dto.tipo,
        monto: signed,
        metodoPago: dto.metodoPago ?? PaymentMethod.EFECTIVO,
        comentario: dto.comentario?.trim() || null,
      },
    });

    return { ok: true };
  }

  async sessionSummary(sessionId: string, establishmentId: string, userId: string) {
    const session = await this.prisma.cashSession.findFirst({
      where: {
        id: sessionId,
        userId,
        cashRegister: { establishmentId },
      },
      include: {
        movements: { orderBy: { createdAt: 'asc' } },
        sales: { select: { id: true, total: true, documentType: true, numero: true } },
      },
    });
    if (!session) throw new NotFoundException('Sesión no encontrada');

    const saldo = session.movements.reduce(
      (acc, row) => acc.plus(row.monto),
      new Prisma.Decimal(0),
    );

    return {
      id: session.id,
      estado: session.estado,
      montoApertura: session.montoApertura.toString(),
      saldoActual: saldo.toString(),
      movimientos: session.movements.map((m) => ({
        id: m.id,
        tipo: m.tipo,
        monto: m.monto.toString(),
        metodoPago: m.metodoPago,
        comentario: m.comentario,
        createdAt: m.createdAt.toISOString(),
      })),
      ventas: session.sales.map((s) => ({
        id: s.id,
        documentType: s.documentType,
        numero: s.numero,
        total: s.total.toString(),
      })),
    };
  }
}
