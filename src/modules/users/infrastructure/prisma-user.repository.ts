import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { IUserRepository } from '../domain/user.repository';
import type {
  CreateUserInput,
  UpdateUserInput,
  UserSnapshot,
} from '../domain/user.types';

function mapUser(
  row: Prisma.UserGetPayload<{ include: { profile: true } }>,
): UserSnapshot {
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    role: row.role,
    establecimientoId: row.establecimientoId,
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
          fotoUrl: row.profile.fotoUrl,
        }
      : null,
  };
}

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateUserInput): Promise<UserSnapshot> {
    const created = await this.prisma.user.create({
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
      include: { profile: true },
    });
    return mapUser(created);
  }

  async findAll(): Promise<UserSnapshot[]> {
    const rows = await this.prisma.user.findMany({
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapUser);
  }

  async findById(id: string): Promise<UserSnapshot | null> {
    const row = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
    return row ? mapUser(row) : null;
  }

  async findByEmail(email: string): Promise<UserSnapshot | null> {
    const row = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
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
            ...this.toProfileCreate(profile),
          },
          update: this.toProfileUpdate(profile),
        });
      }

      return tx.user.findUniqueOrThrow({
        where: { id },
        include: { profile: true },
      });
    });

    return mapUser(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
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
    return out;
  }
}
