import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccountReceivableStatus, Prisma } from '../../generated/prisma/client';
import {
  buildPaginatedResult,
  paginationArgs,
} from '../../common/dto/pagination.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AccountReceivableListQueryDto,
  RegisterAccountReceivablePaymentDto,
} from './dto/accounts-receivable.dto';

@Injectable()
export class AccountsReceivableService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  async list(establishmentId: string, query: AccountReceivableListQueryDto) {
    const { page, pageSize, skip, take } = paginationArgs(query);
    const now = new Date();
    await this.prisma.accountReceivable.updateMany({
      where: {
        establishmentId,
        deletedAt: null,
        estado: {
          in: [
            AccountReceivableStatus.PENDIENTE,
            AccountReceivableStatus.PARCIAL,
          ],
        },
        fechaVencimiento: { lt: now },
      },
      data: { estado: AccountReceivableStatus.VENCIDA },
    });

    const where: Prisma.AccountReceivableWhereInput = {
      establishmentId,
      deletedAt: null,
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.estado
        ? { estado: query.estado as AccountReceivableStatus }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.accountReceivable.count({ where }),
      this.prisma.accountReceivable.findMany({
        where,
        skip,
        take,
        orderBy: { fechaVencimiento: 'asc' },
        select: {
          id: true,
          documentoRef: true,
          montoTotal: true,
          montoPagado: true,
          saldo: true,
          fechaEmision: true,
          fechaVencimiento: true,
          estado: true,
          customer: {
            select: { id: true, nombre: true, numeroDocumento: true },
          },
          agreement: { select: { id: true, codigo: true, nombre: true } },
          sale: { select: { id: true, serie: true, numero: true } },
        },
      }),
    ]);

    return buildPaginatedResult(
      rows.map((r) => ({
        ...r,
        montoTotal: r.montoTotal.toString(),
        montoPagado: r.montoPagado.toString(),
        saldo: r.saldo.toString(),
        fechaEmision: r.fechaEmision.toISOString(),
        fechaVencimiento: r.fechaVencimiento?.toISOString() ?? null,
      })),
      total,
      page,
      pageSize,
    );
  }

  async registerPayment(
    id: string,
    establishmentId: string,
    dto: RegisterAccountReceivablePaymentDto,
    userId: string,
  ) {
    const ar = await this.prisma.accountReceivable.findFirst({
      where: { id, establishmentId, deletedAt: null },
    });
    if (!ar) throw new NotFoundException('Cuenta por cobrar no encontrada');
    if (
      ar.estado === AccountReceivableStatus.PAGADA ||
      ar.estado === AccountReceivableStatus.ANULADA
    ) {
      throw new BadRequestException('La cuenta ya está cerrada');
    }

    const monto = new Prisma.Decimal(dto.amount);
    if (monto.lessThanOrEqualTo(0)) {
      throw new BadRequestException('El monto debe ser mayor a cero');
    }
    if (monto.greaterThan(ar.saldo)) {
      throw new BadRequestException(
        `El pago (${monto.toFixed(2)}) supera el saldo pendiente (${ar.saldo.toFixed(2)})`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.accountReceivablePayment.create({
        data: {
          accountReceivableId: id,
          monto,
          metodoPago: dto.metodo?.trim() || null,
          referencia: dto.referencia?.trim() || null,
          createdById: userId,
        },
      });

      const updated = await tx.accountReceivable.updateMany({
        where: {
          id,
          establishmentId,
          deletedAt: null,
          saldo: { gte: monto },
          estado: {
            notIn: [
              AccountReceivableStatus.PAGADA,
              AccountReceivableStatus.ANULADA,
            ],
          },
        },
        data: {
          montoPagado: { increment: monto },
          saldo: { decrement: monto },
        },
      });
      if (updated.count !== 1) {
        throw new BadRequestException(
          'El monto excede el saldo pendiente o la cuenta ya está cerrada',
        );
      }

      const arAfter = await tx.accountReceivable.findUniqueOrThrow({
        where: { id },
        select: { saldo: true },
      });
      const nuevoEstado = arAfter.saldo.lessThanOrEqualTo(0)
        ? AccountReceivableStatus.PAGADA
        : AccountReceivableStatus.PARCIAL;
      await tx.accountReceivable.update({
        where: { id },
        data: { estado: nuevoEstado },
      });

      return Prisma.Decimal.max(arAfter.saldo, new Prisma.Decimal(0));
    });

    await this.audit.log({
      userId,
      action: 'PAYMENT',
      entity: 'AccountReceivable',
      entityId: id,
    });

    return { ok: true, saldo: result.toString() };
  }
}
