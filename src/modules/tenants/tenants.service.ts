import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  Prisma,
  TenantLeadStatus,
  TenantPlan,
  TenantStatus,
  UserRole,
} from '../../generated/prisma/client';
import {
  buildPaginatedResult,
  paginationArgs,
} from '../../common/dto/pagination.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { expandUserPermissionCodes } from '../../common/permissions/nav-permission-expansion';
import { getDefaultNavCodesForRole } from '../../common/permissions/role-permission-templates';
import { validatePasswordPolicy } from '../../common/validators/password-policy';
import {
  limitsForPlan,
  modulesForPlan,
  parseTenantEnabledModules,
  resolveTenantEnabledModules,
  slugifyTenantName,
} from '../../common/tenants/tenant-plan.util';
import { normalizeTimeZone } from '../../common/utils/timezone.util';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  ConvertTenantLeadDto,
  CreateTenantDto,
  ProvisionTenantDto,
  UpdateTenantDto,
  UpdateTenantLeadDto,
} from './dto/tenant.dto';

const BCRYPT_ROUNDS = 10;

const tenantSelect = {
  id: true,
  nombre: true,
  ruc: true,
  slug: true,
  plan: true,
  status: true,
  maxEstablishments: true,
  maxUsers: true,
  contactName: true,
  contactEmail: true,
  contactPhone: true,
  notes: true,
  enabledModules: true,
  defaultTimeZone: true,
  activatedAt: true,
  suspendedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TenantSelect;

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  async findAll(filters?: {
    search?: string;
    status?: string;
    plan?: string;
    page?: number;
    pageSize?: number;
  }) {
    const search = filters?.search?.trim();
    const statusRaw = filters?.status?.trim().toUpperCase();
    const planRaw = filters?.plan?.trim().toUpperCase();
    const status =
      statusRaw && statusRaw !== 'ALL' && Object.values(TenantStatus).includes(statusRaw as TenantStatus)
        ? (statusRaw as TenantStatus)
        : undefined;
    const plan =
      planRaw && planRaw !== 'ALL' && Object.values(TenantPlan).includes(planRaw as TenantPlan)
        ? (planRaw as TenantPlan)
        : undefined;

    const where: Prisma.TenantWhereInput = {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(plan ? { plan } : {}),
      ...(search
        ? {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' } },
              { slug: { contains: search, mode: 'insensitive' } },
              { ruc: { contains: search } },
              { contactEmail: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const { page, pageSize, skip, take } = paginationArgs({
      page: filters?.page,
      pageSize: filters?.pageSize,
    });

    const [rows, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: tenantSelect,
      }),
      this.prisma.tenant.count({ where }),
    ]);

    const items = await Promise.all(rows.map((row) => this.withUsage(row)));
    return buildPaginatedResult(items, total, page, pageSize);
  }

  async findOne(id: string) {
    const row = await this.prisma.tenant.findFirst({
      where: { id, deletedAt: null },
      select: tenantSelect,
    });
    if (!row) throw new NotFoundException('Cliente no encontrado');
    return this.withUsage(row);
  }

  async create(dto: CreateTenantDto, actorId?: string) {
    const plan = dto.plan ?? TenantPlan.BOTICA;
    const preset = limitsForPlan(plan);
    const slug = await this.uniqueSlug(dto.slug?.trim() || slugifyTenantName(dto.nombre));

    try {
      const created = await this.prisma.tenant.create({
        data: {
          nombre: dto.nombre.trim(),
          ruc: dto.ruc?.trim() || null,
          slug,
          plan,
          status: TenantStatus.PENDING,
          maxEstablishments: dto.maxEstablishments ?? preset.maxEstablishments,
          maxUsers: dto.maxUsers ?? preset.maxUsers,
          contactName: dto.contactName?.trim() || null,
          contactEmail: dto.contactEmail?.trim().toLowerCase() || null,
          contactPhone: dto.contactPhone?.trim() || null,
          notes: dto.notes?.trim() || null,
          enabledModules: modulesForPlan(plan),
        },
        select: tenantSelect,
      });
      await this.audit.log({
        userId: actorId,
        action: 'CREATE',
        entity: 'Tenant',
        entityId: created.id,
      });
      return this.withUsage(created);
    } catch (err) {
      this.handleUniqueError(err);
    }
  }

  async update(id: string, dto: UpdateTenantDto, actorId?: string) {
    const current = await this.ensureTenant(id);
    const data: Prisma.TenantUpdateInput = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre.trim();
    if (dto.ruc !== undefined) data.ruc = dto.ruc.trim() || null;
    if (dto.plan !== undefined) data.plan = dto.plan;
    if (dto.maxEstablishments !== undefined) data.maxEstablishments = dto.maxEstablishments;
    if (dto.maxUsers !== undefined) data.maxUsers = dto.maxUsers;
    if (dto.contactName !== undefined) data.contactName = dto.contactName.trim() || null;
    if (dto.contactEmail !== undefined) data.contactEmail = dto.contactEmail.trim().toLowerCase() || null;
    if (dto.contactPhone !== undefined) data.contactPhone = dto.contactPhone.trim() || null;
    if (dto.notes !== undefined) data.notes = dto.notes.trim() || null;

    const nextPlan = dto.plan ?? current.plan;
    if (dto.applyPlanDefaults) {
      const preset = limitsForPlan(nextPlan);
      data.maxEstablishments = preset.maxEstablishments;
      data.maxUsers = preset.maxUsers;
      data.enabledModules = modulesForPlan(nextPlan);
    } else if (dto.enabledModules !== undefined) {
      const parsed = parseTenantEnabledModules(dto.enabledModules);
      data.enabledModules = parsed ?? [];
    }

    try {
      const updated = await this.prisma.tenant.update({
        where: { id },
        data,
        select: tenantSelect,
      });
      await this.audit.log({
        userId: actorId,
        action: 'UPDATE',
        entity: 'Tenant',
        entityId: id,
      });
      return this.withUsage(updated);
    } catch (err) {
      this.handleUniqueError(err);
    }
  }

  async activate(id: string, actorId?: string) {
    await this.ensureTenant(id);
    const updated = await this.prisma.tenant.update({
      where: { id },
      data: {
        status: TenantStatus.ACTIVE,
        activatedAt: new Date(),
        suspendedAt: null,
      },
      select: tenantSelect,
    });
    await this.audit.log({ userId: actorId, action: 'ACTIVATE', entity: 'Tenant', entityId: id });
    return this.withUsage(updated);
  }

  async suspend(id: string, actorId?: string) {
    await this.ensureTenant(id);
    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { status: TenantStatus.SUSPENDED, suspendedAt: new Date() },
      select: tenantSelect,
    });
    await this.audit.log({ userId: actorId, action: 'SUSPEND', entity: 'Tenant', entityId: id });
    return this.withUsage(updated);
  }

  async provision(id: string, dto: ProvisionTenantDto, actorId?: string) {
    const tenant = await this.ensureTenant(id);
    await this.assertEstablishmentQuota(tenant.id, tenant.maxEstablishments);
    await this.assertUserQuota(tenant.id, tenant.maxUsers);

    const email = dto.adminEmail.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('El correo del administrador ya está registrado');

    const policy = validatePasswordPolicy(dto.adminPassword);
    if (!policy.valid) {
      throw new BadRequestException({
        code: 'WEAK_PASSWORD',
        message: 'Contraseña no cumple la política de seguridad',
        details: policy.errors,
      });
    }

    const passwordHash = await bcrypt.hash(dto.adminPassword, BCRYPT_ROUNDS);
    const permissionCodes = expandUserPermissionCodes(
      getDefaultNavCodesForRole(UserRole.GERENTE_SUCURSAL),
      UserRole.GERENTE_SUCURSAL,
    );

    const result = await this.prisma.$transaction(async (tx) => {
      const establishment = await tx.establishment.create({
        data: {
          tenantId: tenant.id,
          nombre: dto.establishmentNombre.trim(),
          codigo: dto.establishmentCodigo?.trim() || null,
          activo: true,
          correoContacto: email,
          timeZone: normalizeTimeZone(tenant.defaultTimeZone),
        },
        select: { id: true, nombre: true, codigo: true },
      });

      const admin = await tx.user.create({
        data: {
          nombre: dto.adminNombre.trim(),
          email,
          passwordHash,
          role: UserRole.GERENTE_SUCURSAL,
          tenantId: tenant.id,
          establecimientoId: establishment.id,
        },
        select: { id: true, nombre: true, email: true, role: true },
      });

      if (permissionCodes.length) {
        const permissions = await tx.permission.findMany({
          where: { code: { in: permissionCodes } },
          select: { id: true },
        });
        await tx.userPermission.createMany({
          data: permissions.map((p) => ({ userId: admin.id, permissionId: p.id })),
          skipDuplicates: true,
        });
      }

      if (tenant.status === TenantStatus.PENDING) {
        await tx.tenant.update({
          where: { id: tenant.id },
          data: { status: TenantStatus.ACTIVE, activatedAt: new Date() },
        });
      }

      return { establishment, admin };
    });

    await this.audit.log({
      userId: actorId,
      action: 'PROVISION',
      entity: 'Tenant',
      entityId: id,
      diff: result,
    });

    return { tenantId: id, ...result };
  }

  async listLeads(filters?: { status?: string; page?: number; pageSize?: number }) {
    const statusRaw = filters?.status?.trim().toUpperCase();
    const status =
      statusRaw && statusRaw !== 'ALL' && Object.values(TenantLeadStatus).includes(statusRaw as TenantLeadStatus)
        ? (statusRaw as TenantLeadStatus)
        : undefined;

    const where: Prisma.TenantLeadWhereInput = {
      ...(status ? { status } : {}),
    };

    const { page, pageSize, skip, take } = paginationArgs({
      page: filters?.page,
      pageSize: filters?.pageSize,
    });

    const [items, total] = await Promise.all([
      this.prisma.tenantLead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.tenantLead.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, pageSize);
  }

  async updateLead(id: string, dto: UpdateTenantLeadDto, actorId?: string) {
    const lead = await this.prisma.tenantLead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead no encontrado');

    const statusRaw = dto.status?.trim().toUpperCase();
    const status =
      statusRaw && Object.values(TenantLeadStatus).includes(statusRaw as TenantLeadStatus)
        ? (statusRaw as TenantLeadStatus)
        : undefined;

    const updated = await this.prisma.tenantLead.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(dto.planInterest !== undefined ? { planInterest: dto.planInterest } : {}),
      },
    });

    await this.audit.log({
      userId: actorId,
      action: 'UPDATE',
      entity: 'TenantLead',
      entityId: id,
    });

    return updated;
  }

  async convertLead(id: string, dto: ConvertTenantLeadDto, actorId?: string) {
    const lead = await this.prisma.tenantLead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead no encontrado');
    if (lead.status === TenantLeadStatus.CONVERTED) {
      throw new BadRequestException('Este lead ya fue convertido');
    }

    const tenant = await this.create(
      {
        nombre: dto.nombre?.trim() || lead.farmacia.trim(),
        ruc: dto.ruc,
        plan: dto.plan ?? lead.planInterest ?? TenantPlan.BOTICA,
        slug: dto.slug,
        maxEstablishments: dto.maxEstablishments,
        maxUsers: dto.maxUsers,
        contactName: dto.contactName ?? lead.nombre.trim(),
        contactEmail: dto.contactEmail ?? lead.email.trim().toLowerCase(),
        contactPhone: dto.contactPhone ?? lead.telefono.trim(),
        notes: dto.notes ?? lead.mensaje?.trim(),
      },
      actorId,
    );

    const password = dto.adminPassword ?? this.generateTempPassword();
    const provision = await this.provision(
      tenant.id,
      {
        establishmentNombre: dto.establishmentNombre.trim(),
        establishmentCodigo: dto.establishmentCodigo,
        adminNombre: lead.nombre.trim(),
        adminEmail: lead.email.trim().toLowerCase(),
        adminPassword: password,
      },
      actorId,
    );

    await this.prisma.tenantLead.update({
      where: { id },
      data: {
        status: TenantLeadStatus.CONVERTED,
        tenantId: tenant.id,
        convertedAt: new Date(),
      },
    });

    return { tenant, provision, temporaryPassword: dto.adminPassword ? undefined : password };
  }

  async createLeadFromPublic(input: {
    nombre: string;
    farmacia: string;
    telefono: string;
    email: string;
    mensaje?: string;
    planInterest?: TenantPlan;
  }) {
    return this.prisma.tenantLead.create({
      data: {
        nombre: input.nombre.trim(),
        farmacia: input.farmacia.trim(),
        telefono: input.telefono.trim(),
        email: input.email.trim().toLowerCase(),
        mensaje: input.mensaje?.trim() || null,
        planInterest: input.planInterest ?? null,
        source: 'landing',
      },
    });
  }

  async assertUserQuota(tenantId: string, maxUsers: number) {
    const count = await this.prisma.user.count({
      where: { tenantId, deletedAt: null, role: { not: UserRole.SUPER_ADMIN } },
    });
    if (count >= maxUsers) {
      throw new BadRequestException(
        `Límite de usuarios alcanzado (${maxUsers}). Actualice el plan del cliente.`,
      );
    }
  }

  async assertEstablishmentQuota(tenantId: string, maxEstablishments: number) {
    const count = await this.prisma.establishment.count({
      where: { tenantId, deletedAt: null },
    });
    if (count >= maxEstablishments) {
      throw new BadRequestException(
        `Límite de establecimientos alcanzado (${maxEstablishments}). Actualice el plan del cliente.`,
      );
    }
  }

  private async withUsage<T extends { id: string; maxUsers: number; maxEstablishments: number; plan: TenantPlan; enabledModules: unknown }>(
    row: T,
  ) {
    const [usersCount, establishmentsCount] = await Promise.all([
      this.prisma.user.count({
        where: { tenantId: row.id, deletedAt: null, role: { not: UserRole.SUPER_ADMIN } },
      }),
      this.prisma.establishment.count({ where: { tenantId: row.id, deletedAt: null } }),
    ]);
    const enabledModules = resolveTenantEnabledModules({
      plan: row.plan,
      enabledModules: row.enabledModules,
    });
    return {
      ...row,
      enabledModules,
      usage: {
        users: usersCount,
        establishments: establishmentsCount,
        usersRemaining: Math.max(0, row.maxUsers - usersCount),
        establishmentsRemaining: Math.max(0, row.maxEstablishments - establishmentsCount),
      },
    };
  }

  private async ensureTenant(id: string) {
    const row = await this.prisma.tenant.findFirst({
      where: { id, deletedAt: null },
      select: tenantSelect,
    });
    if (!row) throw new NotFoundException('Cliente no encontrado');
    return row;
  }

  private async uniqueSlug(base: string): Promise<string> {
    let slug = base;
    let suffix = 0;
    while (await this.prisma.tenant.findFirst({ where: { slug, deletedAt: null } })) {
      suffix += 1;
      slug = `${base}-${suffix}`;
    }
    return slug;
  }

  private generateTempPassword(): string {
    return `Ff${Math.random().toString(36).slice(2, 8)}!9A`;
  }

  private handleUniqueError(err: unknown): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictException('Ya existe un cliente con ese RUC o slug.');
    }
    throw err;
  }
}
