import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';
import { SensitiveHealthCryptoService } from './sensitive-health-crypto.service';

@Injectable()
export class PharmacistLicenseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly crypto: SensitiveHealthCryptoService,
  ) {}

  async list(includeInactive = false) {
    return this.prisma.pharmacistLicense.findMany({
      where: {
        deletedAt: null,
        ...(includeInactive ? {} : { activo: true }),
      },
      include: {
        user: { select: { id: true, nombre: true, email: true } },
        titularEstablishments: {
          where: { deletedAt: null },
          select: { id: true, nombre: true, codigo: true },
        },
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async create(
    dto: {
      colegiaturaCqp: string;
      fullName: string;
      vigenciaHasta?: string;
      userId?: string;
      activo?: boolean;
    },
    actorId?: string,
  ) {
    const created = await this.prisma.pharmacistLicense.create({
      data: {
        colegiaturaCqp: dto.colegiaturaCqp.trim(),
        fullName: dto.fullName.trim(),
        vigenciaHasta: dto.vigenciaHasta ? new Date(dto.vigenciaHasta) : null,
        userId: dto.userId ?? null,
        activo: dto.activo ?? true,
      },
    });
    await this.audit.log({
      userId: actorId,
      action: 'CREATE',
      entity: 'PharmacistLicense',
      entityId: created.id,
    });
    return created;
  }

  async update(
    id: string,
    dto: {
      colegiaturaCqp?: string;
      fullName?: string;
      vigenciaHasta?: string | null;
      userId?: string | null;
      activo?: boolean;
    },
    actorId?: string,
  ) {
    await this.ensure(id);
    const updated = await this.prisma.pharmacistLicense.update({
      where: { id },
      data: {
        colegiaturaCqp: dto.colegiaturaCqp?.trim() || undefined,
        fullName: dto.fullName?.trim() || undefined,
        vigenciaHasta:
          dto.vigenciaHasta === null
            ? null
            : dto.vigenciaHasta
              ? new Date(dto.vigenciaHasta)
              : undefined,
        userId: dto.userId === null ? null : dto.userId ?? undefined,
        activo: dto.activo ?? undefined,
      },
    });
    await this.audit.log({
      userId: actorId,
      action: 'UPDATE',
      entity: 'PharmacistLicense',
      entityId: id,
      diff: dto,
    });
    return updated;
  }

  async remove(id: string, actorId?: string) {
    await this.ensure(id);
    await this.prisma.pharmacistLicense.update({
      where: { id },
      data: { deletedAt: new Date(), activo: false },
    });
    await this.audit.log({
      userId: actorId,
      action: 'DELETE',
      entity: 'PharmacistLicense',
      entityId: id,
    });
    return { ok: true };
  }

  async validateApproverForControlled(
    approverUserId: string,
    establishmentId: string,
    digitalSignature?: string,
  ) {
    const approver = await this.prisma.user.findFirst({
      where: {
        id: approverUserId,
        establecimientoId: establishmentId,
        deletedAt: null,
      },
      select: { id: true, pharmacistLicense: true },
    });
    if (!approver) {
      throw new BadRequestException('Farmacéutico autorizador no válido');
    }

    const establishment = await this.prisma.establishment.findFirst({
      where: { id: establishmentId, deletedAt: null },
      select: { titularPharmacistLicenseId: true },
    });

    let license =
      approver.pharmacistLicense ??
      (establishment?.titularPharmacistLicenseId
        ? await this.prisma.pharmacistLicense.findFirst({
            where: {
              id: establishment.titularPharmacistLicenseId,
              deletedAt: null,
              activo: true,
            },
          })
        : null);

    if (!license) {
      throw new BadRequestException(
        'El autorizador no tiene colegiatura farmacéutica vigente registrada',
      );
    }

    if (license.vigenciaHasta && license.vigenciaHasta < new Date()) {
      throw new BadRequestException('La colegiatura del farmacéutico está vencida');
    }

    if (digitalSignature) {
      const expected = this.crypto.hashSignature(
        `${license.id}:${approverUserId}:${establishmentId}`,
      );
      if (digitalSignature !== expected) {
        throw new BadRequestException('Firma digital de dispensación inválida');
      }
    }

    return license;
  }

  buildDispensationSignature(licenseId: string, approverUserId: string, establishmentId: string) {
    return this.crypto.hashSignature(`${licenseId}:${approverUserId}:${establishmentId}`);
  }

  private async ensure(id: string) {
    const row = await this.prisma.pharmacistLicense.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!row) throw new NotFoundException('Licencia farmacéutica no encontrada');
  }
}
