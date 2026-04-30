import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductSerialStatus } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SeriesListQueryDto } from './dto/series-list-query.dto';
import { UpdateSeriesStatusDto } from './dto/update-series-status.dto';
import * as XLSX from 'xlsx';

const selectSerialList = {
  id: true,
  serie: true,
  fecha: true,
  estado: true,
  vendido: true,
  product: {
    select: {
      id: true,
      nombre: true,
      codigoInterno: true,
    },
  },
} satisfies Prisma.ProductSerialSelect;

@Injectable()
export class SeriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: SeriesListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const search = query.search?.trim();
    const field = (query.field ?? 'serie').trim();

    const or: Prisma.ProductSerialWhereInput[] = [];
    if (search) {
      if (field === 'all' || field === 'serie') {
        or.push({ serie: { contains: search, mode: 'insensitive' } });
      }
      if (field === 'all' || field === 'producto') {
        or.push({ product: { nombre: { contains: search, mode: 'insensitive' } } });
      }
      if (field === 'all' || field === 'estado') {
        const status = this.toStatus(search);
        if (status) {
          or.push({ estado: status });
        }
      }
    }

    const where: Prisma.ProductSerialWhereInput = {
      deletedAt: null,
      ...(or.length ? { OR: or } : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.productSerial.count({ where }),
      this.prisma.productSerial.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { serie: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: selectSerialList,
      }),
    ]);

    return {
      items: rows,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async updateStatus(id: string, dto: UpdateSeriesStatusDto) {
    const row = await this.prisma.productSerial.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!row) throw new NotFoundException('Serie no encontrada');

    return this.prisma.productSerial.update({
      where: { id },
      data: {
        estado: dto.estado,
        vendido: dto.vendido,
        soldAt: dto.vendido ? new Date() : null,
      },
      select: selectSerialList,
    });
  }

  async remove(id: string) {
    const row = await this.prisma.productSerial.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!row) throw new NotFoundException('Serie no encontrada');
    await this.prisma.productSerial.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { ok: true };
  }

  async buildExportBuffer(query: SeriesListQueryDto) {
    const data = await this.list({ ...query, page: 1, pageSize: 100000 });
    const rows = data.items.map((x) => ({
      Serie: x.serie,
      Producto: x.product.nombre,
      Fecha: this.formatDate(x.fecha),
      Estado: x.estado,
      Vendido: x.vendido ? 'SI' : 'NO',
    }));
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Series');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  private toStatus(search: string): ProductSerialStatus | null {
    const key = search.trim().toUpperCase();
    if (key.includes('DISP')) return ProductSerialStatus.DISPONIBLE;
    if (key.includes('RES')) return ProductSerialStatus.RESERVADO;
    if (key.includes('VEND')) return ProductSerialStatus.VENDIDO;
    if (key.includes('ANUL')) return ProductSerialStatus.ANULADO;
    return null;
  }

  private formatDate(date: Date): string {
    if (!(date instanceof Date)) throw new BadRequestException('Fecha inválida');
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
