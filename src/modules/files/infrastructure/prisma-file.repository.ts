import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { ArchivoRow, IFileRepository } from '../domain/file.repository';

@Injectable()
export class PrismaFileRepository implements IFileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    id: string;
    nombreOriginal: string;
    mimeType: string;
    tamanoBytes: number;
    rutaRelativa: string;
    uploadedByUserId: string | null;
  }): Promise<ArchivoRow> {
    const row = await this.prisma.archivo.create({ data });
    return {
      id: row.id,
      nombreOriginal: row.nombreOriginal,
      mimeType: row.mimeType,
      tamanoBytes: row.tamanoBytes,
      rutaRelativa: row.rutaRelativa,
    };
  }

  async findById(id: string): Promise<ArchivoRow | null> {
    const row = await this.prisma.archivo.findUnique({ where: { id } });
    if (!row) return null;
    return {
      id: row.id,
      nombreOriginal: row.nombreOriginal,
      mimeType: row.mimeType,
      tamanoBytes: row.tamanoBytes,
      rutaRelativa: row.rutaRelativa,
    };
  }
}
