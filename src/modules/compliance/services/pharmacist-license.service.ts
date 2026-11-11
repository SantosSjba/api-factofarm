import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';
import { EntityIntegrityService } from '../../../common/services/entity-integrity.service';
import { canApproveControlledDispense, isPlatformAdmin } from '../../../common/permissions/role-policy.util';
import type { JwtRequestUser } from '../../auth/domain/auth.types';
import { Prisma } from '../../../generated/prisma/client';
import { SensitiveHealthCryptoService } from './sensitive-health-crypto.service';

@Injectable()
export class PharmacistLicenseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly crypto: SensitiveHealthCryptoService,
    private readonly integrity: EntityIntegrityService,
  ) {}

  /** Licencias del cliente del usuario (la plataforma ve todas). */
  private tenantScope(actor: JwtRequestUser): Prisma.PharmacistLicenseWhereInput {
    if (isPlatformAdmin(actor.role)) return {};
    if (!actor.tenantId) throw new BadRequestException('Usuario sin cliente asignado');
    return { tenantId: actor.tenantId };
  }

  /** El usuario vinculado debe ser del mismo cliente. */
  private async assertUserInTenant(userId: string | null | undefined, actor: JwtRequestUser) {
    if (!userId || isPlatformAdmin(actor.role)) return;
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId: actor.tenantId ?? undefined, deletedAt: null },
      select: { id: true },
    });
    if (!user) throw new BadRequestException('El usuario indicado no pertenece a tu empresa.');
  }

  async list(actor: JwtRequestUser, includeInactive = false) {
    return this.prisma.pharmacistLicense.findMany({
      where: {
        deletedAt: null,
        ...this.tenantScope(actor),
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
    actor: JwtRequestUser,
  ) {
    await this.assertUserInTenant(dto.userId, actor);
    const actorId = actor.sub;
    const created = await this.prisma.pharmacistLicense.create({
      data: {
        tenantId: actor.tenantId ?? null,
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
    actor: JwtRequestUser,
  ) {
    await this.ensure(id, actor);
    await this.assertUserInTenant(dto.userId, actor);
    const actorId = actor.sub;
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
        userId: dto.userId === null ? null : (dto.userId ?? undefined),
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

  async remove(id: string, actor: JwtRequestUser) {
    await this.ensure(id, actor);
    const actorId = actor.sub;
    await this.integrity.assertCanDeletePharmacistLicense(id);
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
      select: { id: true, role: true, pharmacistLicense: true },
    });
    if (!approver) {
      throw new BadRequestException('Farmacéutico autorizador no válido');
    }
    if (!canApproveControlledDispense(approver.role)) {
      throw new BadRequestException(
        'Solo un farmacéutico o gerente autorizado puede aprobar dispensación de controlados',
      );
    }

    const establishment = await this.prisma.establishment.findFirst({
      where: { id: establishmentId, deletedAt: null },
      select: { titularPharmacistLicenseId: true },
    });

    const license =
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
      throw new BadRequestException(
        'La colegiatura del farmacéutico está vencida',
      );
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

  buildDispensationSignature(
    licenseId: string,
    approverUserId: string,
    establishmentId: string,
  ) {
    return this.crypto.hashSignature(
      `${licenseId}:${approverUserId}:${establishmentId}`,
    );
  }

  /** La licencia existe y es del cliente del usuario (si no, «no encontrada»). */
  async ensure(id: string, actor: JwtRequestUser) {
    const row = await this.prisma.pharmacistLicense.findFirst({
      where: { id, deletedAt: null, ...this.tenantScope(actor) },
      select: { id: true },
    });
    if (!row)
      throw new NotFoundException('Licencia farmacéutica no encontrada');
  }
}
