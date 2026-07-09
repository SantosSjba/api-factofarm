import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../../generated/prisma/client';
import { AuditLogService } from '../../../common/services/audit-log.service';
import { expandUserPermissionCodes } from '../../../common/permissions/nav-permission-expansion';
import { getDefaultNavCodesForRole } from '../../../common/permissions/role-permission-templates';
import { isPlatformAdmin } from '../../../common/permissions/role-policy.util';
import { validatePasswordPolicy } from '../../../common/validators/password-policy';
import { assertTenantAccess, actorFromJwt } from '../../../common/scoping/tenant-scope.util';
import { TenantsService } from '../../tenants/tenants.service';
import type { JwtRequestUser } from '../../auth/domain/auth.types';
import { USER_REPOSITORY } from '../domain/user.repository';
import type { IUserRepository } from '../domain/user.repository';
import type {
  CreateUserInput,
  UpdateUserInput,
  UserSnapshot,
} from '../domain/user.types';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    private readonly audit: AuditLogService,
    private readonly tenants: TenantsService,
  ) {}

  async create(dto: CreateUserDto, actor?: JwtRequestUser): Promise<UserSnapshot> {
    const existing = await this.users.findByEmail(dto.email.toLowerCase().trim());
    if (existing) {
      throw new ConflictException('El correo ya está registrado');
    }

    const policy = validatePasswordPolicy(dto.password);
    if (!policy.valid) {
      throw new BadRequestException({
        code: 'WEAK_PASSWORD',
        message: 'Contraseña no cumple la política de seguridad',
        details: policy.errors,
      });
    }

    if (dto.role === UserRole.SUPER_ADMIN && actor?.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Solo plataforma puede crear super administradores');
    }

    const tenantId = await this.resolveTenantIdForCreate(dto, actor);
    if (tenantId) {
      const tenant = await this.tenants.findOne(tenantId);
      await this.tenants.assertUserQuota(tenantId, tenant.maxUsers);
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const input: CreateUserInput = {
      nombre: dto.nombre.trim(),
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      role: dto.role,
      tenantId,
      establecimientoId: dto.establecimientoId,
      profile: dto.profile ? this.mapProfileDto(dto.profile) : undefined,
      permissionCodes: this.resolvePermissionCodes(dto.permissionCodes, dto.role),
    };

    const created = await this.users.create(input);
    await this.audit.log({
      userId: actor?.sub,
      action: 'CREATE',
      entity: 'User',
      entityId: created.id,
    });
    return created;
  }

  async findAll(
    rawFilters?: {
      search?: string;
      role?: string;
      page?: number;
      pageSize?: number;
      tenantId?: string;
    },
    actor?: JwtRequestUser,
  ) {
    const search = rawFilters?.search?.trim();
    const roleRaw = rawFilters?.role?.trim().toUpperCase();
    const role =
      roleRaw && roleRaw !== 'ALL' && Object.values(UserRole).includes(roleRaw as UserRole)
        ? (roleRaw as UserRole)
        : undefined;

    return this.users.findAll({
      ...(search ? { search } : {}),
      ...(role ? { role } : {}),
      ...(this.resolveTenantFilter(actor, rawFilters?.tenantId)
        ? { tenantId: this.resolveTenantFilter(actor, rawFilters?.tenantId)! }
        : {}),
      page: rawFilters?.page,
      pageSize: rawFilters?.pageSize,
    });
  }

  async findOne(id: string, actor?: JwtRequestUser): Promise<UserSnapshot> {
    const u = await this.users.findById(id);
    if (!u) throw new NotFoundException('Usuario no encontrado');
    if (actor) {
      this.assertUserTenantAccess(u, actor);
    }
    return u;
  }

  async update(id: string, dto: UpdateUserDto, actor?: JwtRequestUser): Promise<UserSnapshot> {
    const current = await this.users.findById(id);
    if (!current) throw new NotFoundException('Usuario no encontrado');
    if (actor) {
      this.assertUserTenantAccess(current, actor);
    }

    if (dto.email && dto.email.toLowerCase().trim() !== current.email) {
      const taken = await this.users.findByEmail(dto.email.toLowerCase().trim());
      if (taken) throw new ConflictException('El correo ya está registrado');
    }

    if (dto.password) {
      const policy = validatePasswordPolicy(dto.password);
      if (!policy.valid) {
        throw new BadRequestException({
          code: 'WEAK_PASSWORD',
          message: 'Contraseña no cumple la política de seguridad',
          details: policy.errors,
        });
      }
    }

    const role = dto.role ?? current.role;
    if (dto.role === UserRole.SUPER_ADMIN && actor?.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Solo plataforma puede asignar super administrador');
    }
    const patch: UpdateUserInput = {};
    if (dto.nombre !== undefined) patch.nombre = dto.nombre.trim();
    if (dto.email !== undefined) patch.email = dto.email.toLowerCase().trim();
    if (dto.password !== undefined) {
      patch.passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    }
    if (dto.role !== undefined) patch.role = dto.role;
    if (dto.establecimientoId !== undefined) {
      const tenantId = current.tenantId ?? actor?.tenantId;
      if (tenantId) {
        await this.assertEstablishmentBelongsToTenant(dto.establecimientoId, tenantId);
      }
      patch.establecimientoId = dto.establecimientoId;
    }
    if (dto.profile !== undefined) patch.profile = this.mapProfileDto(dto.profile);
    if (dto.permissionCodes !== undefined) {
      patch.permissionCodes = this.normalizePermissionCodes(dto.permissionCodes, role);
    } else if (dto.role !== undefined && dto.role !== current.role) {
      patch.permissionCodes = this.resolvePermissionCodes(undefined, role);
    }

    const updated = await this.users.update(id, patch);
    await this.audit.log({
      userId: actor?.sub,
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
    });
    return updated;
  }

  async updatePermissions(
    id: string,
    permissionCodes: string[],
    actor?: JwtRequestUser,
  ): Promise<UserSnapshot> {
    const current = await this.users.findById(id);
    if (!current) throw new NotFoundException('Usuario no encontrado');
    if (actor) {
      this.assertUserTenantAccess(current, actor);
    }

    const normalized = this.normalizePermissionCodes(permissionCodes, current.role);
    if (!normalized?.length) {
      throw new BadRequestException('Debe indicar al menos un permiso');
    }

    const updated = await this.users.syncPermissions(id, normalized);
    await this.audit.log({
      userId: actor?.sub,
      action: 'UPDATE_PERMISSIONS',
      entity: 'User',
      entityId: id,
      diff: { permissionCodes: normalized },
    });
    return updated;
  }

  async remove(id: string, actor?: JwtRequestUser): Promise<void> {
    const current = await this.users.findById(id);
    if (!current) throw new NotFoundException('Usuario no encontrado');
    if (actor) {
      this.assertUserTenantAccess(current, actor);
    }
    await this.users.delete(id);
    await this.audit.log({
      userId: actor?.sub,
      action: 'DELETE',
      entity: 'User',
      entityId: id,
    });
  }

  private assertUserTenantAccess(user: UserSnapshot, actor: JwtRequestUser): void {
    if (user.role === UserRole.SUPER_ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No puede acceder a usuarios de plataforma');
    }
    if (user.tenantId) {
      assertTenantAccess(actorFromJwt(actor), user.tenantId);
    }
  }

  private resolvePermissionCodes(
    codes: string[] | undefined,
    role: UserRole,
  ): string[] {
    const navCodes =
      codes && codes.length > 0 ? codes : getDefaultNavCodesForRole(role);
    return expandUserPermissionCodes(navCodes, role);
  }

  private normalizePermissionCodes(
    codes: string[] | undefined,
    role: UserRole,
  ): string[] | undefined {
    if (codes === undefined) return undefined;
    const trimmed = codes.map((c) => c.trim()).filter(Boolean);
    if (trimmed.length === 0) return [];
    return expandUserPermissionCodes(trimmed, role);
  }

  private resolveTenantFilter(
    actor?: JwtRequestUser,
    requestedTenantId?: string,
  ): string | undefined {
    if (actor && !isPlatformAdmin(actor.role)) {
      return actor.tenantId ?? undefined;
    }
    return requestedTenantId?.trim() || undefined;
  }

  private async resolveTenantIdForCreate(
    dto: CreateUserDto,
    actor?: JwtRequestUser,
  ): Promise<string | null> {
    if (dto.role === UserRole.SUPER_ADMIN) {
      return null;
    }

    if (actor && !isPlatformAdmin(actor.role)) {
      if (!actor.tenantId) {
        throw new ForbiddenException('Usuario sin tenant asignado');
      }
      await this.assertEstablishmentBelongsToTenant(dto.establecimientoId, actor.tenantId);
      return actor.tenantId;
    }

    if (!dto.tenantId) {
      throw new BadRequestException('Debe indicar tenantId del cliente');
    }
    await this.assertEstablishmentBelongsToTenant(dto.establecimientoId, dto.tenantId);
    return dto.tenantId;
  }

  private async assertEstablishmentBelongsToTenant(
    establishmentId: string,
    tenantId: string,
  ): Promise<void> {
    const ok = await this.users.establishmentBelongsToTenant(establishmentId, tenantId);
    if (!ok) {
      throw new BadRequestException('El establecimiento no pertenece al cliente indicado');
    }
  }

  private mapProfileDto(
    dto: NonNullable<CreateUserDto['profile']> | NonNullable<UpdateUserDto['profile']>,
  ): NonNullable<CreateUserInput['profile']> {
    return {
      tipoDocumento: dto.tipoDocumento,
      numeroDocumento: dto.numeroDocumento,
      nombres: dto.nombres,
      apellidos: dto.apellidos,
      fechaNacimiento: dto.fechaNacimiento,
      emailPersonal: dto.emailPersonal,
      direccion: dto.direccion,
      celularPersonal: dto.celularPersonal,
      emailCorporativo: dto.emailCorporativo,
      celularCorporativo: dto.celularCorporativo,
      fechaContratacion: dto.fechaContratacion,
      cargo: dto.cargo,
      fotoUrl: dto.fotoUrl,
      fotoArchivoId: dto.fotoArchivoId,
    };
  }
}
