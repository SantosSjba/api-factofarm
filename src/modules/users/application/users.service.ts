import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { USER_REPOSITORY } from '../domain/user.repository';
import type { IUserRepository } from '../domain/user.repository';
import type { CreateUserInput, UpdateUserInput, UserSnapshot } from '../domain/user.types';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async create(dto: CreateUserDto): Promise<UserSnapshot> {
    const existing = await this.users.findByEmail(dto.email.toLowerCase().trim());
    if (existing) {
      throw new ConflictException('El correo ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const input: CreateUserInput = {
      nombre: dto.nombre.trim(),
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      role: dto.role,
      establecimientoId: dto.establecimientoId,
      profile: dto.profile ? this.mapProfileDto(dto.profile) : undefined,
    };

    return this.users.create(input);
  }

  async findAll(): Promise<UserSnapshot[]> {
    return this.users.findAll();
  }

  async findOne(id: string): Promise<UserSnapshot> {
    const u = await this.users.findById(id);
    if (!u) throw new NotFoundException('Usuario no encontrado');
    return u;
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserSnapshot> {
    const current = await this.users.findById(id);
    if (!current) throw new NotFoundException('Usuario no encontrado');

    if (dto.email && dto.email.toLowerCase().trim() !== current.email) {
      const taken = await this.users.findByEmail(dto.email.toLowerCase().trim());
      if (taken) throw new ConflictException('El correo ya está registrado');
    }

    const patch: UpdateUserInput = {};
    if (dto.nombre !== undefined) patch.nombre = dto.nombre.trim();
    if (dto.email !== undefined) patch.email = dto.email.toLowerCase().trim();
    if (dto.password !== undefined) {
      patch.passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    }
    if (dto.role !== undefined) patch.role = dto.role;
    if (dto.establecimientoId !== undefined) patch.establecimientoId = dto.establecimientoId;
    if (dto.profile !== undefined) patch.profile = this.mapProfileDto(dto.profile);

    return this.users.update(id, patch);
  }

  async remove(id: string): Promise<void> {
    const current = await this.users.findById(id);
    if (!current) throw new NotFoundException('Usuario no encontrado');
    await this.users.delete(id);
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
