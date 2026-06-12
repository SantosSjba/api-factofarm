import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import {
  buildPaginatedResult,
  paginationArgs,
} from '../../../common/dto/pagination.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import type { IUserRepository } from '../domain/user.repository';
import type {
  CreateUserInput,
  UpdateUserInput,
  UserListFilters,
  UserProfileSnapshot,
  UserSnapshot,
} from '../domain/user.types';

const userSnapshotInclude = {
  profile: true,
  establecimiento: { select: { nombre: true } },
  permissions: { include: { permission: true } },
} satisfies Prisma.UserInclude;

type UserRow = Prisma.UserGetPayload<{ include: typeof userSnapshotInclude }>;

function mapUser(row: UserRow): UserSnapshot {
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    role: row.role,
    establecimientoId: row.establecimientoId,
    establecimientoNombre: row.establecimiento.nombre,
    permissionCodes: row.permissions.map((up) => up.permission.code),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    profile: row.profile
      ? {
          tipoDocumento: row.profile.tipoDocumento,
          numeroDocumento: row.profile.numeroDocumento,
          nombres: row.profile.nombres,
          apellidos: row.profile.apellidos,
          fechaNacimiento: row.profile.fechaNacimiento,
          emailPersonal: row.profile.emailPersonal,
          direccion: row.profile.direccion,
          celularPersonal: row.profile.celularPersonal,
          emailCorporativo: row.profile.emailCorporativo,
          celularCorporativo: row.profile.celularCorporativo,
          fechaContratacion: row.profile.fechaContratacion,
          cargo: row.profile.cargo,
          fotoArchivoId: row.profile.fotoArchivoId,
          fotoUrl:
            row.profile.fotoUrl ??
            (row.profile.fotoArchivoId != null
              ? `/api/v1/files/${row.profile.fotoArchivoId}`
              : null),
        }
      : null,
  };
}

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateUserInput): Promise<UserSnapshot> {
    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          nombre: input.nombre,
          email: input.email,
          passwordHash: input.passwordHash,
          role: input.role,
          establecimientoId: input.establecimientoId,
          profile: input.profile
            ? { create: this.toProfileCreate(input.profile) }
            : undefined,
        },
      });

      if (input.permissionCodes?.length) {
        await this.replacePermissions(tx, user.id, input.permissionCodes);
      }

      return tx.user.findUniqueOrThrow({
        where: { id: user.id },
        include: userSnapshotInclude,
      });
    });
    return mapUser(created);
  }

  async findAll(filters?: UserListFilters) {
    const search = filters?.search?.trim();
    const { page, pageSize, skip, take } = paginationArgs({
      page: filters?.page,
      pageSize: filters?.pageSize,
    });

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(filters?.role ? { role: filters.role } : {}),
      ...(search
        ? {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: userSnapshotInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return buildPaginatedResult(rows.map(mapUser), total, page, pageSize);
  }

  async findById(id: string): Promise<UserSnapshot | null> {
    const row = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: userSnapshotInclude,
    });
    return row ? mapUser(row) : null;
  }

  async findByEmail(email: string): Promise<UserSnapshot | null> {
    const row = await this.prisma.user.findUnique({
      where: { email },
      include: userSnapshotInclude,
    });
    return row ? mapUser(row) : null;
  }

  async update(id: string, input: UpdateUserInput): Promise<UserSnapshot> {
    const { profile, ...userPatch } = input;

    const data: Prisma.UserUpdateInput = {};
    if (userPatch.nombre !== undefined) data.nombre = userPatch.nombre;
    if (userPatch.email !== undefined) data.email = userPatch.email;
    if (userPatch.passwordHash !== undefined) data.passwordHash = userPatch.passwordHash;
    if (userPatch.role !== undefined) data.role = userPatch.role;
    if (userPatch.establecimientoId !== undefined) {
      data.establecimiento = {
        connect: { id: userPatch.establecimientoId },
      };
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        await tx.user.update({ where: { id }, data });
      }

      if (profile !== undefined) {
        await tx.userProfile.upsert({
          where: { userId: id },
          create: {
            userId: id,
            ...this.toProfileUncheckedCreate(profile),
          },
          update: this.toProfileUpdate(profile),
        });
      }

      if (input.permissionCodes !== undefined) {
        await this.replacePermissions(tx, id, input.permissionCodes);
      }

      return tx.user.findUniqueOrThrow({
        where: { id },
        include: userSnapshotInclude,
      });
    });

    return mapUser(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async syncPermissions(userId: string, permissionCodes: string[]): Promise<UserSnapshot> {
    const updated = await this.prisma.$transaction(async (tx) => {
      await this.replacePermissions(tx, userId, permissionCodes);
      return tx.user.findUniqueOrThrow({
        where: { id: userId },
        include: userSnapshotInclude,
      });
    });
    return mapUser(updated);
  }

  private async replacePermissions(
    tx: Prisma.TransactionClient,
    userId: string,
    codes: string[],
  ): Promise<void> {
    const unique = [...new Set(codes.map((c) => c.trim()).filter(Boolean))];
    const permissions = await tx.permission.findMany({
      where: { code: { in: unique } },
    });
    await tx.userPermission.deleteMany({ where: { userId } });
    if (permissions.length > 0) {
      await tx.userPermission.createMany({
        data: permissions.map((p) => ({ userId, permissionId: p.id })),
      });
    }
  }

  private toProfileCreate(
    p: NonNullable<CreateUserInput['profile']>,
  ): Prisma.UserProfileCreateWithoutUserInput {
    return {
      tipoDocumento: p.tipoDocumento ?? undefined,
      numeroDocumento: p.numeroDocumento ?? undefined,
      nombres: p.nombres ?? undefined,
      apellidos: p.apellidos ?? undefined,
      fechaNacimiento: p.fechaNacimiento ?? undefined,
      emailPersonal: p.emailPersonal ?? undefined,
      direccion: p.direccion ?? undefined,
      celularPersonal: p.celularPersonal ?? undefined,
      emailCorporativo: p.emailCorporativo ?? undefined,
      celularCorporativo: p.celularCorporativo ?? undefined,
      fechaContratacion: p.fechaContratacion ?? undefined,
      cargo: p.cargo ?? undefined,
      fotoUrl: p.fotoUrl ?? undefined,
      ...(p.fotoArchivoId
        ? { fotoArchivo: { connect: { id: p.fotoArchivoId } } }
        : {}),
    };
  }

  /** Upsert `create` exige forma Unchecked (`userId`) + escalares como `fotoArchivoId`. */
  private toProfileUncheckedCreate(
    p: Partial<UserProfileSnapshot>,
  ): Omit<Prisma.UserProfileUncheckedCreateInput, 'userId'> {
    return {
      tipoDocumento: p.tipoDocumento ?? undefined,
      numeroDocumento: p.numeroDocumento ?? undefined,
      nombres: p.nombres ?? undefined,
      apellidos: p.apellidos ?? undefined,
      fechaNacimiento: p.fechaNacimiento ?? undefined,
      emailPersonal: p.emailPersonal ?? undefined,
      direccion: p.direccion ?? undefined,
      celularPersonal: p.celularPersonal ?? undefined,
      emailCorporativo: p.emailCorporativo ?? undefined,
      celularCorporativo: p.celularCorporativo ?? undefined,
      fechaContratacion: p.fechaContratacion ?? undefined,
      cargo: p.cargo ?? undefined,
      fotoUrl: p.fotoUrl ?? undefined,
      fotoArchivoId: p.fotoArchivoId ?? undefined,
    };
  }

  private toProfileUpdate(
    p: NonNullable<UpdateUserInput['profile']>,
  ): Prisma.UserProfileUpdateInput {
    const out: Prisma.UserProfileUpdateInput = {};
    if (p.tipoDocumento !== undefined) out.tipoDocumento = p.tipoDocumento;
    if (p.numeroDocumento !== undefined) out.numeroDocumento = p.numeroDocumento;
    if (p.nombres !== undefined) out.nombres = p.nombres;
    if (p.apellidos !== undefined) out.apellidos = p.apellidos;
    if (p.fechaNacimiento !== undefined) out.fechaNacimiento = p.fechaNacimiento;
    if (p.emailPersonal !== undefined) out.emailPersonal = p.emailPersonal;
    if (p.direccion !== undefined) out.direccion = p.direccion;
    if (p.celularPersonal !== undefined) out.celularPersonal = p.celularPersonal;
    if (p.emailCorporativo !== undefined) out.emailCorporativo = p.emailCorporativo;
    if (p.celularCorporativo !== undefined) {
      out.celularCorporativo = p.celularCorporativo;
    }
    if (p.fechaContratacion !== undefined) out.fechaContratacion = p.fechaContratacion;
    if (p.cargo !== undefined) out.cargo = p.cargo;
    if (p.fotoUrl !== undefined) out.fotoUrl = p.fotoUrl;
    if (p.fotoArchivoId !== undefined) {
      if (p.fotoArchivoId === null) {
        out.fotoArchivo = { disconnect: true };
      } else {
        out.fotoArchivo = { connect: { id: p.fotoArchivoId } };
      }
    }
    return out;
  }
}
