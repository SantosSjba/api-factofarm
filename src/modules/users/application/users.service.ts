import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../../generated/prisma/client';
import { AuditLogService } from '../../../common/services/audit-log.service';
import { expandUserPermissionCodes } from '../../../common/permissions/nav-permission-expansion';
import { validatePasswordPolicy } from '../../../common/validators/password-policy';
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
  ) {}

  async create(dto: CreateUserDto, actorId?: string): Promise<UserSnapshot> {
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

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const input: CreateUserInput = {
      nombre: dto.nombre.trim(),
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      role: dto.role,
      establecimientoId: dto.establecimientoId,
      profile: dto.profile ? this.mapProfileDto(dto.profile) : undefined,
      permissionCodes: this.normalizePermissionCodes(dto.permissionCodes, dto.role),
    };

    const created = await this.users.create(input);
    await this.audit.log({
      userId: actorId,
      action: 'CREATE',
      entity: 'User',
      entityId: created.id,
    });
    return created;
  }

  async findAll(rawFilters?: {
    search?: string;
    role?: string;
    page?: number;
    pageSize?: number;
  }) {
    const search = rawFilters?.search?.trim();
    const roleRaw = rawFilters?.role?.trim().toUpperCase();
    const role =
      roleRaw === UserRole.ADMINISTRADOR || roleRaw === UserRole.VENDEDOR
        ? roleRaw
        : undefined;

    return this.users.findAll({
      ...(search ? { search } : {}),
      ...(role ? { role } : {}),
      page: rawFilters?.page,
      pageSize: rawFilters?.pageSize,
    });
  }

  async findOne(id: string): Promise<UserSnapshot> {
    const u = await this.users.findById(id);
    if (!u) throw new NotFoundException('Usuario no encontrado');
    return u;
  }

  async update(id: string, dto: UpdateUserDto, actorId?: string): Promise<UserSnapshot> {
    const current = await this.users.findById(id);
    if (!current) throw new NotFoundException('Usuario no encontrado');

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
    const patch: UpdateUserInput = {};
    if (dto.nombre !== undefined) patch.nombre = dto.nombre.trim();
    if (dto.email !== undefined) patch.email = dto.email.toLowerCase().trim();
    if (dto.password !== undefined) {
      patch.passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    }
    if (dto.role !== undefined) patch.role = dto.role;
    if (dto.establecimientoId !== undefined) patch.establecimientoId = dto.establecimientoId;
    if (dto.profile !== undefined) patch.profile = this.mapProfileDto(dto.profile);
    if (dto.permissionCodes !== undefined) {
      patch.permissionCodes = this.normalizePermissionCodes(dto.permissionCodes, role);
    }

    const updated = await this.users.update(id, patch);
    await this.audit.log({
      userId: actorId,
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
    });
    return updated;
  }

  async updatePermissions(
    id: string,
    permissionCodes: string[],
    actorId?: string,
  ): Promise<UserSnapshot> {
    const current = await this.users.findById(id);
    if (!current) throw new NotFoundException('Usuario no encontrado');

    const normalized = this.normalizePermissionCodes(permissionCodes, current.role);
    if (!normalized?.length) {
      throw new BadRequestException('Debe indicar al menos un permiso');
    }

    const updated = await this.users.syncPermissions(id, normalized);
    await this.audit.log({
      userId: actorId,
      action: 'UPDATE_PERMISSIONS',
      entity: 'User',
      entityId: id,
      diff: { permissionCodes: normalized },
    });
    return updated;
  }

  async remove(id: string, actorId?: string): Promise<void> {
    const current = await this.users.findById(id);
    if (!current) throw new NotFoundException('Usuario no encontrado');
    await this.users.delete(id);
    await this.audit.log({
      userId: actorId,
      action: 'DELETE',
      entity: 'User',
      entityId: id,
    });
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
