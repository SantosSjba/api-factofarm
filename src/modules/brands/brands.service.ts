import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

const selectBrand = {
  id: true,
  nombre: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BrandSelect;

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filters?: { search?: string; field?: string }) {
    const search = filters?.search?.trim();
    const field = filters?.field?.trim().toLowerCase();

    const searchableFields: Prisma.BrandWhereInput[] = [
      { nombre: { contains: search, mode: 'insensitive' } },
    ];

    const where: Prisma.BrandWhereInput = {
      deletedAt: null,
      ...(search
        ? {
            OR: field === 'nombre' || !field || field === 'all' ? searchableFields : searchableFields,
          }
        : {}),
    };

    return this.prisma.brand.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: selectBrand,
    });
  }

  async create(dto: CreateBrandDto) {
    const nombre = this.normalizeNombre(dto.nombre);
    try {
      return await this.prisma.brand.create({
        data: { nombre },
        select: selectBrand,
      });
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async update(id: string, dto: UpdateBrandDto) {
    const current = await this.prisma.brand.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!current) {
      throw new NotFoundException('Marca no encontrada');
    }

    const data: Prisma.BrandUpdateInput = {};
    if (dto.nombre !== undefined) {
      data.nombre = this.normalizeNombre(dto.nombre);
    }

    try {
      return await this.prisma.brand.update({
        where: { id },
        data,
        select: selectBrand,
      });
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async remove(id: string) {
    const current = await this.prisma.brand.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!current) {
      throw new NotFoundException('Marca no encontrada');
    }

    await this.prisma.brand.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private normalizeNombre(value: string): string {
    return value.trim().toUpperCase();
  }

  private handleKnownError(err: unknown): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictException('Ya existe una marca con ese nombre.');
    }
    throw err;
  }
}
