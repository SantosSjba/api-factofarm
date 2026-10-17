import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CashMovementType,
  CashSessionStatus,
  PaymentMethod,
  Prisma,
  SaleStatus,
} from '../../generated/prisma/client';
import { AuditLogService } from '../../common/services/audit-log.service';
import {
  hasChainScope,
  isPlatformAdmin,
} from '../../common/permissions/role-policy.util';
import {
  formatDateTimeInTimeZone,
  normalizeTimeZone,
} from '../../common/utils/timezone.util';
import {
  canForceCloseCashSessions,
  canReadAllCashSessions,
  hoursOpen,
  STALE_CASH_SESSION_HOURS,
  type CashActor,
} from './cash-access.util';
import { cashOnHand, expectedCashBySession } from './cash-session.util';
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

  async createRegister(
    establishmentId: string,
    dto: CreateCashRegisterDto,
    actorId?: string,
  ) {
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
        ...(dto.printerPaperWidth !== undefined
          ? { printerPaperWidth: dto.printerPaperWidth }
          : {}),
        ...(dto.printerAutoPrint !== undefined
          ? { printerAutoPrint: dto.printerAutoPrint }
          : {}),
        ...(dto.openCashDrawerOnPrint !== undefined
          ? { openCashDrawerOnPrint: dto.openCashDrawerOnPrint }
          : {}),
        ...(dto.barcodeWedgeEnabled !== undefined
          ? { barcodeWedgeEnabled: dto.barcodeWedgeEnabled }
          : {}),
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
    // Sin filtrar `deletedAt` de la caja: una sesión abierta en una caja dada de baja
    // también debe verse para poder cerrarla.
    return this.prisma.cashSession.findFirst({
      where: {
        userId,
        estado: CashSessionStatus.ABIERTA,
        cashRegister: { establishmentId },
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

  /**
   * Cajas abiertas ahora en el establecimiento (de cualquier usuario), para que la pantalla
   * de apertura explique por qué una caja está ocupada y quién puede cerrarla.
   */
  async listOpenSessions(actor: CashActor) {
    const rows = await this.prisma.cashSession.findMany({
      where: {
        estado: CashSessionStatus.ABIERTA,
        cashRegister: { establishmentId: actor.establishmentId },
      },
      orderBy: { openedAt: 'asc' },
      select: {
        id: true,
        openedAt: true,
        montoApertura: true,
        userId: true,
        user: { select: { id: true, nombre: true } },
        cashRegister: { select: { id: true, nombre: true, deletedAt: true } },
      },
    });
    const supervisor = canReadAllCashSessions(actor);
    const forceClose = canForceCloseCashSessions(actor);
    const expected = supervisor
      ? await expectedCashBySession(
          this.prisma,
          rows.map((r) => r.id),
        )
      : new Map<string, Prisma.Decimal>();
    const now = new Date();
    return rows.map((row) => {
      const isMine = row.userId === actor.userId;
      const horas = hoursOpen(row.openedAt, now);
      return {
        id: row.id,
        openedAt: row.openedAt.toISOString(),
        horasAbierta: horas,
        pendiente: horas >= STALE_CASH_SESSION_HOURS,
        cashRegister: {
          id: row.cashRegister.id,
          nombre: row.cashRegister.nombre,
          eliminada: !!row.cashRegister.deletedAt,
        },
        user: row.user,
        isMine,
        canClose: isMine || forceClose,
        // Los montos solo para el propio cajero o supervisores.
        montoApertura:
          isMine || supervisor ? row.montoApertura.toString() : null,
        efectivoEsperado:
          supervisor || isMine
            ? (expected.get(row.id) ?? row.montoApertura).toString()
            : null,
      };
    });
  }

  async openSession(
    establishmentId: string,
    userId: string,
    dto: OpenCashSessionDto,
  ) {
    const register = await this.prisma.cashRegister.findFirst({
      where: {
        id: dto.cashRegisterId,
        establishmentId,
        deletedAt: null,
        activo: true,
      },
      select: { id: true, nombre: true },
    });
    if (!register) throw new NotFoundException('Caja no encontrada');

    const tz = await this.timeZoneOf(establishmentId);
    const existing = await this.getActiveSession(establishmentId, userId);
    if (existing) {
      throw new BadRequestException(
        `Ya tiene abierta la caja "${existing.cashRegister.nombre}" (desde ${formatDateTimeInTimeZone(existing.openedAt, tz, 'es-PE', { timeStyle: 'short' })}). Ciérrela con su arqueo antes de abrir otra.`,
      );
    }

    const registerOpen = await this.prisma.cashSession.findFirst({
      where: {
        cashRegisterId: dto.cashRegisterId,
        estado: CashSessionStatus.ABIERTA,
      },
      select: { openedAt: true, user: { select: { nombre: true } } },
    });
    if (registerOpen) {
      throw new BadRequestException(
        `La caja "${register.nombre}" está abierta por ${registerOpen.user.nombre} (desde ${formatDateTimeInTimeZone(registerOpen.openedAt, tz, 'es-PE', { timeStyle: 'short' })}). Debe cerrarla ese usuario o un supervisor (cierre forzado).`,
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
      diff: {
        cashRegisterId: register.id,
        caja: register.nombre,
        montoApertura: montoApertura.toString(),
      },
    });

    return {
      id: session.id,
      montoApertura: session.montoApertura.toString(),
      openedAt: session.openedAt.toISOString(),
    };
  }

  /**
   * Cierre con arqueo. El propio cajero cierra su caja; un supervisor puede cerrar la caja
   * de otro usuario (cierre forzado) indicando el motivo, y queda registrado quién la cerró.
   */
  async closeSession(
    sessionId: string,
    actor: CashActor,
    dto: CloseCashSessionDto,
  ) {
    const session = await this.prisma.cashSession.findFirst({
      where: { id: sessionId },
      select: {
        id: true,
        estado: true,
        userId: true,
        openedAt: true,
        user: { select: { nombre: true } },
        cashRegister: {
          select: {
            nombre: true,
            establishment: { select: { id: true, tenantId: true } },
          },
        },
      },
    });
    if (!session || !this.inScope(actor, session.cashRegister.establishment)) {
      throw new NotFoundException('Sesión de caja no encontrada');
    }
    if (session.estado !== CashSessionStatus.ABIERTA) {
      throw new BadRequestException('La sesión de caja ya fue cerrada');
    }

    const forced = session.userId !== actor.userId;
    const motivo = dto.motivoCierreForzado?.trim() || null;
    if (forced) {
      if (!canForceCloseCashSessions(actor)) {
        throw new ForbiddenException(
          `Esta caja la abrió ${session.user.nombre}. Solo ese usuario o un supervisor con permiso de cierre forzado puede cerrarla.`,
        );
      }
      if (!motivo) {
        throw new BadRequestException(
          'Indique el motivo del cierre forzado (la caja la abrió otro usuario).',
        );
      }
    }

    // El arqueo compara efectivo contado contra efectivo esperado: los movimientos con otros
    // medios (Yape, tarjeta…) no están en la gaveta.
    const montoSistema = await cashOnHand(this.prisma, sessionId);
    const montoFisico = new Prisma.Decimal(dto.montoCierreFisico);
    const diferencia = montoFisico.minus(montoSistema);
    const notas = dto.notasCierre?.trim() || null;
    if (!diferencia.isZero() && !notas) {
      throw new BadRequestException(
        `El arqueo tiene una diferencia de S/ ${diferencia.toFixed(2)} (sistema S/ ${montoSistema.toFixed(2)}, contado S/ ${montoFisico.toFixed(2)}). Explique la diferencia en las observaciones de cierre.`,
      );
    }

    const closedAt = new Date();
    const closed = await this.prisma.$transaction(async (tx) => {
      const res = await tx.cashSession.updateMany({
        where: { id: sessionId, estado: CashSessionStatus.ABIERTA },
        data: {
          estado: CashSessionStatus.CERRADA,
          montoCierreSistema: montoSistema,
          montoCierreFisico: montoFisico,
          diferenciaArqueo: diferencia,
          notasCierre: notas,
          closedAt,
          closedById: actor.userId,
          cierreForzado: forced,
          motivoCierreForzado: forced ? motivo : null,
        },
      });
      if (res.count !== 1) return false;
      await tx.cashMovement.create({
        data: {
          cashSessionId: sessionId,
          tipo: CashMovementType.CIERRE,
          monto: montoFisico,
          metodoPago: PaymentMethod.EFECTIVO,
          comentario: forced
            ? `Cierre forzado: ${motivo}`.slice(0, 500)
            : notas || 'Cierre de caja',
        },
      });
      return true;
    });
    if (!closed) {
      throw new BadRequestException('La sesión de caja ya fue cerrada');
    }

    await this.audit.log({
      userId: actor.userId,
      action: forced ? 'FORCE_CLOSE' : 'CLOSE',
      entity: 'CashSession',
      entityId: sessionId,
      diff: {
        caja: session.cashRegister.nombre,
        cajeroId: session.userId,
        cajero: session.user.nombre,
        openedAt: session.openedAt.toISOString(),
        montoCierreSistema: montoSistema.toString(),
        montoCierreFisico: montoFisico.toString(),
        diferenciaArqueo: diferencia.toString(),
        ...(notas ? { notasCierre: notas } : {}),
        ...(forced ? { motivoCierreForzado: motivo } : {}),
      },
    });

    return {
      ok: true,
      id: sessionId,
      cierreForzado: forced,
      montoCierreSistema: montoSistema.toString(),
      montoCierreFisico: montoFisico.toString(),
      diferenciaArqueo: diferencia.toString(),
    };
  }

  async addMovement(
    sessionId: string,
    establishmentId: string,
    userId: string,
    dto: CreateCashMovementDto,
  ) {
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

    if (
      dto.tipo !== CashMovementType.INGRESO &&
      dto.tipo !== CashMovementType.EGRESO
    ) {
      throw new BadRequestException(
        'Solo ingresos o egresos manuales en sesión abierta',
      );
    }

    if (!dto.comentario?.trim()) {
      throw new BadRequestException(
        'Indique el motivo del ingreso o egreso de caja.',
      );
    }
    const metodo = dto.metodoPago ?? PaymentMethod.EFECTIVO;
    const signed =
      dto.tipo === CashMovementType.EGRESO
        ? new Prisma.Decimal(dto.monto).negated()
        : new Prisma.Decimal(dto.monto);
    if (signed.isNegative() && metodo === PaymentMethod.EFECTIVO) {
      const available = await cashOnHand(this.prisma, sessionId);
      if (signed.abs().greaterThan(available)) {
        throw new BadRequestException(
          `Efectivo insuficiente en caja: disponible S/ ${available.toFixed(2)}, egreso S/ ${signed.abs().toFixed(2)}.`,
        );
      }
    }

    await this.prisma.cashMovement.create({
      data: {
        cashSessionId: sessionId,
        tipo: dto.tipo,
        monto: signed,
        metodoPago: metodo,
        comentario: dto.comentario.trim(),
      },
    });

    return { ok: true };
  }

  /** Detalle completo de una sesión (propia, o de cualquiera para supervisores). */
  async sessionSummary(sessionId: string, actor: CashActor) {
    const session = await this.prisma.cashSession.findFirst({
      where: { id: sessionId },
      include: {
        user: { select: { id: true, nombre: true } },
        closedBy: { select: { id: true, nombre: true } },
        cashRegister: {
          select: {
            id: true,
            nombre: true,
            printerPaperWidth: true,
            establishment: {
              select: {
                id: true,
                nombre: true,
                tenantId: true,
                timeZone: true,
              },
            },
          },
        },
        movements: { orderBy: { createdAt: 'asc' } },
        sales: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            total: true,
            estado: true,
            createdAt: true,
            documentType: true,
            serie: true,
            numero: true,
            payments: {
              select: { metodo: true, monto: true, referencia: true },
            },
          },
        },
      },
    });
    const isMine = session?.userId === actor.userId;
    if (
      !session ||
      !this.inScope(actor, session.cashRegister.establishment) ||
      (!isMine && !canReadAllCashSessions(actor))
    ) {
      throw new NotFoundException('Sesión no encontrada');
    }

    const zero = new Prisma.Decimal(0);
    const cashRows = session.movements.filter(
      (row) =>
        row.metodoPago === PaymentMethod.EFECTIVO &&
        row.tipo !== CashMovementType.CIERRE,
    );
    const saldo = cashRows.reduce((acc, row) => acc.plus(row.monto), zero);
    const sumTipo = (tipo: CashMovementType, onlyCash = true) =>
      session.movements
        .filter(
          (m) =>
            m.tipo === tipo &&
            (!onlyCash || m.metodoPago === PaymentMethod.EFECTIVO),
        )
        .reduce((acc, m) => acc.plus(m.monto), zero);

    const totalesPorMetodo: Partial<Record<PaymentMethod, Prisma.Decimal>> = {};
    const pagosDigitales: Array<{
      saleId: string;
      comprobante: string;
      metodo: PaymentMethod;
      monto: string;
      referencia: string | null;
    }> = [];
    let totalVentas = zero;
    let ventasAnuladas = 0;

    for (const sale of session.sales) {
      // Las ventas anuladas ya revirtieron su efectivo con un movimiento ANULACION.
      if (sale.estado === SaleStatus.ANULADA) {
        ventasAnuladas++;
        continue;
      }
      totalVentas = totalVentas.plus(sale.total);
      for (const payment of sale.payments) {
        totalesPorMetodo[payment.metodo] = (
          totalesPorMetodo[payment.metodo] ?? zero
        ).plus(payment.monto);
        if (paymentRequiresReference(payment.metodo) || payment.referencia) {
          pagosDigitales.push({
            saleId: sale.id,
            comprobante: `${sale.serie ?? ''}-${sale.numero ?? ''}`.replace(
              /^-/,
              '',
            ),
            metodo: payment.metodo,
            monto: payment.monto.toString(),
            referencia: payment.referencia,
          });
        }
      }
    }

    const open = session.estado === CashSessionStatus.ABIERTA;
    const now = new Date();
    return {
      id: session.id,
      estado: session.estado,
      isMine,
      canClose: open && (isMine || canForceCloseCashSessions(actor)),
      cashRegister: {
        id: session.cashRegister.id,
        nombre: session.cashRegister.nombre,
        printerPaperWidth: session.cashRegister.printerPaperWidth,
      },
      establishment: {
        id: session.cashRegister.establishment.id,
        nombre: session.cashRegister.establishment.nombre,
        timeZone: session.cashRegister.establishment.timeZone,
      },
      user: session.user,
      closedBy: session.closedBy,
      openedAt: session.openedAt.toISOString(),
      closedAt: session.closedAt?.toISOString() ?? null,
      horasAbierta: hoursOpen(session.openedAt, session.closedAt ?? now),
      pendiente:
        open && hoursOpen(session.openedAt, now) >= STALE_CASH_SESSION_HOURS,
      montoApertura: session.montoApertura.toString(),
      saldoActual: saldo.toString(),
      efectivoEsperado: (session.montoCierreSistema ?? saldo).toString(),
      montoCierreSistema: session.montoCierreSistema?.toString() ?? null,
      montoCierreFisico: session.montoCierreFisico?.toString() ?? null,
      diferenciaArqueo: session.diferenciaArqueo?.toString() ?? null,
      notasCierre: session.notasCierre,
      cierreForzado: session.cierreForzado,
      motivoCierreForzado: session.motivoCierreForzado,
      resumenEfectivo: {
        apertura: session.montoApertura.toString(),
        ventasEfectivo: sumTipo(CashMovementType.VENTA).toString(),
        ingresos: sumTipo(CashMovementType.INGRESO).toString(),
        egresos: sumTipo(CashMovementType.EGRESO).toString(),
        anulaciones: sumTipo(CashMovementType.ANULACION).toString(),
      },
      totalVentas: totalVentas.toString(),
      numVentas: session.sales.length - ventasAnuladas,
      ventasAnuladas,
      totalesPorMetodo: Object.fromEntries(
        Object.entries(totalesPorMetodo).map(([metodo, monto]) => [
          metodo,
          monto.toString(),
        ]),
      ),
      pagosDigitales,
      movimientos: session.movements.map((m) => ({
        id: m.id,
        tipo: m.tipo,
        monto: m.monto.toString(),
        metodoPago: m.metodoPago,
        referencia: m.referencia,
        comentario: m.comentario,
        createdAt: m.createdAt.toISOString(),
      })),
      ventas: session.sales.map((s) => ({
        id: s.id,
        documentType: s.documentType,
        serie: s.serie,
        numero: s.numero,
        estado: s.estado,
        createdAt: s.createdAt.toISOString(),
        total: s.total.toString(),
      })),
    };
  }

  /** La sesión pertenece al tenant del actor y, sin alcance de cadena, a su local. */
  private inScope(
    actor: CashActor,
    establishment: { id: string; tenantId: string },
  ): boolean {
    if (isPlatformAdmin(actor.role)) return true;
    if (!actor.tenantId || establishment.tenantId !== actor.tenantId) {
      return false;
    }
    return (
      hasChainScope(actor.role) || establishment.id === actor.establishmentId
    );
  }

  private async timeZoneOf(establishmentId: string): Promise<string> {
    const row = await this.prisma.establishment.findUnique({
      where: { id: establishmentId },
      select: { timeZone: true },
    });
    return normalizeTimeZone(row?.timeZone);
  }
}
