import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrescriptionStatus, Prisma } from '../../generated/prisma/client';
import { buildPaginatedResult, paginationArgs } from '../../common/dto/pagination.dto';
import { EstablishmentScopeService } from '../../common/scoping/establishment-scope.service';
import { actorFromJwt, assertTenantAccess } from '../../common/scoping/tenant-scope.util';
import { AuditLogService } from '../../common/services/audit-log.service';
import { isPlatformAdmin } from '../../common/permissions/role-policy.util';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { SensitiveHealthCryptoService } from '../compliance/services/sensitive-health-crypto.service';
import {
  CreatePrescriptionDto,
  DispensePrescriptionDto,
  PrescriptionListQueryDto,
} from './dto/prescription.dto';

@Injectable()
export class PrescriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly crypto: SensitiveHealthCryptoService,
    private readonly scope: EstablishmentScopeService,
  ) {}

  async findAll(establishmentId: string, query: PrescriptionListQueryDto) {
    const { page, pageSize, skip, take } = paginationArgs(query);
    const where: Prisma.PrescriptionWhereInput = {
      establishmentId,
      deletedAt: null,
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.estado ? { estado: query.estado } : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              { numero: { contains: query.search.trim(), mode: 'insensitive' } },
              { medicoNombre: { contains: query.search.trim(), mode: 'insensitive' } },
              { customer: { nombre: { contains: query.search.trim(), mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.prescription.count({ where }),
      this.prisma.prescription.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          numero: true,
          fechaEmision: true,
          estado: true,
          medicoNombre: true,
          medicoCmp: true,
          customer: { select: { id: true, nombre: true, numeroDocumento: true } },
          items: {
            select: {
              id: true,
              productId: true,
              cantidadPrescrita: true,
              cantidadDispensada: true,
              product: { select: { nombre: true, codigoInterno: true } },
            },
          },
          createdAt: true,
        },
      }),
    ]);
    return buildPaginatedResult(
      rows.map((r) => ({
        ...r,
        fechaEmision: r.fechaEmision.toISOString(),
        createdAt: r.createdAt.toISOString(),
        items: r.items.map((i) => ({
          ...i,
          cantidadPrescrita: i.cantidadPrescrita.toString(),
          cantidadDispensada: i.cantidadDispensada.toString(),
        })),
      })),
      total,
      page,
      pageSize,
    );
  }

  async findOne(id: string, establishmentId: string) {
    const row = await this.prisma.prescription.findFirst({
      where: { id, establishmentId, deletedAt: null },
      include: {
        customer: { select: { id: true, nombre: true, numeroDocumento: true, tipoDocumento: true } },
        medico: { select: { id: true, cmp: true, nombres: true, apellidos: true, especialidad: true } },
        items: {
          include: { product: { select: { id: true, nombre: true, codigoInterno: true, necesitaRecetaMedica: true } } },
        },
      },
    });
    if (!row) throw new NotFoundException('Receta no encontrada');
    return this.mapDetail(row);
  }

  async findByCustomer(customerId: string, establishmentId: string, actor: JwtRequestUser) {
    await this.scope.assertCustomerInTenant(actor, customerId);
    const rows = await this.prisma.prescription.findMany({
      where: {
        customerId,
        establishmentId,
        deletedAt: null,
        estado: { in: [PrescriptionStatus.ACTIVA, PrescriptionStatus.PARCIALMENTE_DISPENSADA] },
      },
      orderBy: { fechaEmision: 'desc' },
      select: { id: true, numero: true, fechaEmision: true, estado: true, medicoNombre: true },
    });
    return rows.map((r) => ({
      ...r,
      fechaEmision: r.fechaEmision.toISOString(),
    }));
  }

  async create(establishmentId: string, dto: CreatePrescriptionDto, actor: JwtRequestUser) {
    if (dto.items.length === 0) throw new BadRequestException('La receta requiere al menos un ítem');

    await this.scope.assertCustomerInTenant(actor, dto.customerId);
    for (const item of dto.items) {
      await this.scope.assertProductInTenant(actor, item.productId);
    }
    if (dto.imagenArchivoId) {
      await this.assertArchivoInTenant(actor, dto.imagenArchivoId);
    }

    let medicoNombre = dto.medicoNombre?.trim() || null;
    let medicoCmp = dto.medicoCmp?.trim() || null;
    if (dto.medicoId) {
      const medico = await this.prisma.medico.findFirst({
        where: { id: dto.medicoId, deletedAt: null, activo: true },
        select: { nombres: true, apellidos: true, cmp: true },
      });
      if (!medico) throw new NotFoundException('Médico no encontrado');
      medicoNombre = `${medico.nombres} ${medico.apellidos}`;
      medicoCmp = medico.cmp;
    }

    const numero = await this.resolveNumero(establishmentId);

    const diagnosticoPlain = dto.diagnostico?.trim() || null;
    const notasPlain = dto.notas?.trim() || null;
    const encryptHealth = this.crypto.isEnabled();

    const created = await this.prisma.prescription.create({
      data: {
        establishmentId,
        numero,
        fechaEmision: new Date(dto.fechaEmision),
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        customerId: dto.customerId,
        medicoId: dto.medicoId ?? null,
        medicoNombre,
        medicoCmp,
        diagnostico: encryptHealth ? null : diagnosticoPlain,
        notas: encryptHealth ? null : notasPlain,
        diagnosticoCipher: encryptHealth ? this.crypto.encrypt(diagnosticoPlain) : null,
        notasCipher: encryptHealth ? this.crypto.encrypt(notasPlain) : null,
        imagenArchivoId: dto.imagenArchivoId ?? null,
        registeredById: actor.sub,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            dosis: item.dosis?.trim() || null,
            cantidadPrescrita: new Prisma.Decimal(item.cantidadPrescrita),
            indicaciones: item.indicaciones?.trim() || null,
          })),
        },
      },
      select: { id: true },
    });

    await this.audit.log({
      userId: actor.sub,
      action: 'CREATE',
      entity: 'Prescription',
      entityId: created.id,
    });
    return this.findOne(created.id, establishmentId);
  }

  async attachImage(id: string, establishmentId: string, imagenArchivoId: string, actor: JwtRequestUser) {
    const prescription = await this.prisma.prescription.findFirst({
      where: { id, establishmentId, deletedAt: null },
      select: { id: true },
    });
    if (!prescription) throw new NotFoundException('Receta no encontrada');

    await this.assertArchivoInTenant(actor, imagenArchivoId);

    await this.prisma.prescription.update({
      where: { id },
      data: { imagenArchivoId },
    });

    await this.audit.log({
      userId: actor.sub,
      action: 'UPDATE',
      entity: 'Prescription',
      entityId: id,
      diff: { imagenArchivoId },
    });

    return this.findOne(id, establishmentId);
  }

  private async assertArchivoInTenant(actor: JwtRequestUser, archivoId: string) {
    const archivo = await this.prisma.archivo.findUnique({
      where: { id: archivoId },
      select: { id: true, tenantId: true },
    });
    if (!archivo) throw new NotFoundException('Archivo no encontrado');
    if (!archivo.tenantId) {
      if (isPlatformAdmin(actor.role)) return;
      throw new ForbiddenException('Archivo sin tenant asignado');
    }
    assertTenantAccess(actorFromJwt(actor), archivo.tenantId);
  }

  async validateForSale(
    prescriptionId: string,
    establishmentId: string,
    saleItems: Array<{ productId: string; cantidad: Prisma.Decimal }>,
    substitutions?: Array<{ originalProductId: string; substituteProductId: string }>,
  ) {
    const prescription = await this.prisma.prescription.findFirst({
      where: {
        id: prescriptionId,
        establishmentId,
        deletedAt: null,
        estado: { in: [PrescriptionStatus.ACTIVA, PrescriptionStatus.PARCIALMENTE_DISPENSADA] },
      },
      include: { items: true },
    });
    if (!prescription) throw new BadRequestException('Receta no válida o no activa');
    if (prescription.validUntil && prescription.validUntil < new Date()) {
      throw new BadRequestException('La receta está vencida');
    }

    for (const saleItem of saleItems) {
      const substitution = substitutions?.find((s) => s.substituteProductId === saleItem.productId);
      const prescribedProductId = substitution?.originalProductId ?? saleItem.productId;
      const line = prescription.items.find((i) => i.productId === prescribedProductId);
      if (!line) {
        throw new BadRequestException('El producto no está en la receta indicada');
      }
      const pendiente = line.cantidadPrescrita.minus(line.cantidadDispensada);
      if (pendiente.lessThan(saleItem.cantidad)) {
        throw new BadRequestException('Cantidad a dispensar excede lo prescrito pendiente');
      }
    }
    return prescription;
  }

  async applyDispenseFromSale(
    prescriptionId: string,
    saleItems: Array<{ productId: string; cantidad: Prisma.Decimal }>,
    actorId?: string,
  ) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: { items: true },
    });
    if (!prescription) return;

    await this.prisma.$transaction(async (tx) => {
      for (const saleItem of saleItems) {
        const line = prescription.items.find((i) => i.productId === saleItem.productId);
        if (!line) continue;
        await tx.prescriptionItem.update({
          where: { id: line.id },
          data: { cantidadDispensada: line.cantidadDispensada.plus(saleItem.cantidad) },
        });
      }

      const updatedItems = await tx.prescriptionItem.findMany({ where: { prescriptionId } });
      const allDone = updatedItems.every((i) => i.cantidadDispensada.greaterThanOrEqualTo(i.cantidadPrescrita));
      const anyDispensed = updatedItems.some((i) => i.cantidadDispensada.greaterThan(0));
      const estado = allDone
        ? PrescriptionStatus.COMPLETADA
        : anyDispensed
          ? PrescriptionStatus.PARCIALMENTE_DISPENSADA
          : PrescriptionStatus.ACTIVA;

      await tx.prescription.update({ where: { id: prescriptionId }, data: { estado } });
    });

    await this.audit.log({
      userId: actorId,
      action: 'DISPENSE',
      entity: 'Prescription',
      entityId: prescriptionId,
    });
  }

  async manualDispense(
    id: string,
    establishmentId: string,
    dto: DispensePrescriptionDto,
    actorId?: string,
  ) {
    const items = dto.items.map((i) => ({
      productId: i.productId,
      cantidad: new Prisma.Decimal(i.cantidad),
    }));
    await this.validateForSale(id, establishmentId, items);
    await this.applyDispenseFromSale(id, items, actorId);
    return this.findOne(id, establishmentId);
  }

  private async resolveNumero(establishmentId: string) {
    const last = await this.prisma.prescription.findFirst({
      where: { establishmentId },
      orderBy: { createdAt: 'desc' },
      select: { numero: true },
    });
    const next = (Number.parseInt(last?.numero?.replace(/\D/g, '') ?? '0', 10) || 0) + 1;
    return `RX-${String(next).padStart(6, '0')}`;
  }

  private mapDetail(
    row: Prisma.PrescriptionGetPayload<{
      include: {
        customer: { select: { id: true; nombre: true; numeroDocumento: true; tipoDocumento: true } };
        medico: { select: { id: true; cmp: true; nombres: true; apellidos: true; especialidad: true } };
        items: { include: { product: { select: { id: true; nombre: true; codigoInterno: true; necesitaRecetaMedica: true } } } };
      };
    }>,
  ) {
    return {
      id: row.id,
      numero: row.numero,
      fechaEmision: row.fechaEmision.toISOString(),
      validUntil: row.validUntil?.toISOString() ?? null,
      estado: row.estado,
      diagnostico: row.diagnostico,
      notas: row.notas,
      medicoNombre: row.medicoNombre,
      medicoCmp: row.medicoCmp,
      medico: row.medico,
      imagenArchivoId: row.imagenArchivoId,
      customer: row.customer,
      items: row.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        dosis: i.dosis,
        indicaciones: i.indicaciones,
        cantidadPrescrita: i.cantidadPrescrita.toString(),
        cantidadDispensada: i.cantidadDispensada.toString(),
        pendiente: i.cantidadPrescrita.minus(i.cantidadDispensada).toString(),
        product: i.product,
      })),
      createdAt: row.createdAt.toISOString(),
    };
  }
}
