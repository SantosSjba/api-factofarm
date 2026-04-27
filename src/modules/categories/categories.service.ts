import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const selectCategory = {
  id: true,
  nombre: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CategorySelect;

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filters?: { search?: string; field?: string }) {
    const search = filters?.search?.trim();
    const field = filters?.field?.trim().toLowerCase();

    const searchableFields: Prisma.CategoryWhereInput[] = [
      { nombre: { contains: search, mode: 'insensitive' } },
    ];

    const where: Prisma.CategoryWhereInput = {
      deletedAt: null,
      ...(search
        ? {
            OR:
              field === 'nombre' || !field || field === 'all'
                ? searchableFields
                : searchableFields,
          }
        : {}),
    };

    return this.prisma.category.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: selectCategory,
    });
  }

  async create(dto: CreateCategoryDto) {
    const nombre = this.normalizeNombre(dto.nombre);
    try {
      return await this.prisma.category.create({
        data: { nombre },
        select: selectCategory,
      });
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const current = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!current) {
      throw new NotFoundException('Categoría no encontrada');
    }

    const data: Prisma.CategoryUpdateInput = {};
    if (dto.nombre !== undefined) {
      data.nombre = this.normalizeNombre(dto.nombre);
    }

    try {
      return await this.prisma.category.update({
        where: { id },
        data,
        select: selectCategory,
      });
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async remove(id: string) {
    const current = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!current) {
      throw new NotFoundException('Categoría no encontrada');
    }

    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private normalizeNombre(value: string): string {
    return value.trim().toUpperCase();
  }

  private handleKnownError(err: unknown): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictException('Ya existe una categoría con ese nombre.');
    }
    throw err;
  }
}
