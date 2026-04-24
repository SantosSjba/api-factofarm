import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerTypeDto } from './dto/create-customer-type.dto';
import { UpdateCustomerTypeDto } from './dto/update-customer-type.dto';

const selectCustomerType = {
  id: true,
  descripcion: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CustomerTypeSelect;

@Injectable()
export class CustomerTypesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filters?: { search?: string; field?: string }) {
    const search = filters?.search?.trim();
    const field = filters?.field?.trim().toLowerCase();

    const searchableFields: Prisma.CustomerTypeWhereInput[] = [
      { descripcion: { contains: search, mode: 'insensitive' } },
    ];

    const where: Prisma.CustomerTypeWhereInput = {
      deletedAt: null,
      ...(search
        ? {
            OR:
              field === 'descripcion' || !field || field === 'all'
                ? searchableFields
                : searchableFields,
          }
        : {}),
    };

    return this.prisma.customerType.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: selectCustomerType,
    });
  }

  async create(dto: CreateCustomerTypeDto) {
    const descripcion = this.normalizeDescripcion(dto.descripcion);
    try {
      return await this.prisma.customerType.create({
        data: { descripcion },
        select: selectCustomerType,
      });
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async update(id: string, dto: UpdateCustomerTypeDto) {
    const current = await this.prisma.customerType.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!current) {
      throw new NotFoundException('Tipo de cliente no encontrado');
    }

    const data: Prisma.CustomerTypeUpdateInput = {};
    if (dto.descripcion !== undefined) {
      data.descripcion = this.normalizeDescripcion(dto.descripcion);
    }

    try {
      return await this.prisma.customerType.update({
        where: { id },
        data,
        select: selectCustomerType,
      });
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async remove(id: string) {
    const current = await this.prisma.customerType.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!current) {
      throw new NotFoundException('Tipo de cliente no encontrado');
    }
    await this.prisma.customerType.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private normalizeDescripcion(value: string): string {
    return value.trim().toUpperCase();
  }

  private handleKnownError(err: unknown): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictException('Ya existe un tipo de cliente con esa descripción.');
    }
    throw err;
  }
}
