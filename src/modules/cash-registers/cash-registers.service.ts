import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CashMovementType, CashSessionStatus, PaymentMethod, Prisma } from '../../generated/prisma/client';
import { AuditLogService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../prisma/prisma.service';
import { paymentRequiresReference } from '../sales/utils/payment-validation.util';
import {
  CloseCashSessionDto,
  CreateCashMovementDto,
  CreateCashRegisterDto,
  OpenCashSessionDto,
  UpdateCashRegisterHardwareDto,
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
      select: {
        id: true,
        nombre: true,
        activo: true,
        printerPaperWidth: true,
        printerAutoPrint: true,
        openCashDrawerOnPrint: true,
        barcodeWedgeEnabled: true,
        customerDisplayEnabled: true,
        escposPrinterName: true,
      },
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

  async updateHardware(
    registerId: string,
    establishmentId: string,
    dto: UpdateCashRegisterHardwareDto,
    actorId?: string,
  ) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { id: registerId, establishmentId, deletedAt: null },
      select: { id: true },
    });
    if (!register) throw new NotFoundException('Caja no encontrada');

    const updated = await this.prisma.cashRegister.update({
      where: { id: registerId },
      data: {
        ...(dto.printerPaperWidth !== undefined ? { printerPaperWidth: dto.printerPaperWidth } : {}),
        ...(dto.printerAutoPrint !== undefined ? { printerAutoPrint: dto.printerAutoPrint } : {}),
        ...(dto.openCashDrawerOnPrint !== undefined
          ? { openCashDrawerOnPrint: dto.openCashDrawerOnPrint }
          : {}),
        ...(dto.barcodeWedgeEnabled !== undefined ? { barcodeWedgeEnabled: dto.barcodeWedgeEnabled } : {}),
        ...(dto.customerDisplayEnabled !== undefined
          ? { customerDisplayEnabled: dto.customerDisplayEnabled }
          : {}),
        ...(dto.escposPrinterName !== undefined
          ? { escposPrinterName: dto.escposPrinterName?.trim() || null }
          : {}),
      },
      select: {
        id: true,
        nombre: true,
        activo: true,
        printerPaperWidth: true,
        printerAutoPrint: true,
        openCashDrawerOnPrint: true,
        barcodeWedgeEnabled: true,
        customerDisplayEnabled: true,
        escposPrinterName: true,
      },
    });

    await this.audit.log({
      userId: actorId,
      action: 'UPDATE_HARDWARE',
      entity: 'CashRegister',
      entityId: registerId,
    });

    return updated;
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
        cashRegister: {
          select: {
            id: true,
            nombre: true,
            printerPaperWidth: true,
            printerAutoPrint: true,
            openCashDrawerOnPrint: true,
            barcodeWedgeEnabled: true,
            customerDisplayEnabled: true,
            escposPrinterName: true,
          },
        },
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

    const registerOpen = await this.prisma.cashSession.count({
      where: {
        cashRegisterId: dto.cashRegisterId,
        estado: CashSessionStatus.ABIERTA,
      },
    });
    if (registerOpen > 0) {
      throw new BadRequestException(
        'La caja ya tiene una sesión abierta. Ciérrela antes de abrir otra.',
      );
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
        sales: {
          select: {
            id: true,
            total: true,
            documentType: true,
            serie: true,
            numero: true,
            payments: { select: { metodo: true, monto: true, referencia: true } },
          },
        },
      },
    });
    if (!session) throw new NotFoundException('Sesión no encontrada');

    const saldo = session.movements.reduce(
      (acc, row) => acc.plus(row.monto),
      new Prisma.Decimal(0),
    );

    const totalesPorMetodo: Partial<Record<PaymentMethod, Prisma.Decimal>> = {};
    const pagosDigitales: Array<{
      saleId: string;
      comprobante: string;
      metodo: PaymentMethod;
      monto: string;
      referencia: string | null;
    }> = [];

    for (const sale of session.sales) {
      for (const payment of sale.payments) {
        totalesPorMetodo[payment.metodo] = (totalesPorMetodo[payment.metodo] ?? new Prisma.Decimal(0)).plus(
          payment.monto,
        );
        if (paymentRequiresReference(payment.metodo) || payment.referencia) {
          pagosDigitales.push({
            saleId: sale.id,
            comprobante: `${sale.serie ?? ''}-${sale.numero ?? ''}`.replace(/^-/, ''),
            metodo: payment.metodo,
            monto: payment.monto.toString(),
            referencia: payment.referencia,
          });
        }
      }
    }

    return {
      id: session.id,
      estado: session.estado,
      montoApertura: session.montoApertura.toString(),
      saldoActual: saldo.toString(),
      totalesPorMetodo: Object.fromEntries(
        Object.entries(totalesPorMetodo).map(([metodo, monto]) => [metodo, monto!.toString()]),
      ),
      pagosDigitales,
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
