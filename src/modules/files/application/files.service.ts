import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream, existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, extname, join, resolve } from 'path';
import { randomUUID } from 'crypto';
import type { Express } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';

const MAX_BYTES = 10 * 1024 * 1024;

@Injectable()
export class FilesService {
  private readonly uploadsRoot: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    const dir = config.get<string>('UPLOADS_DIR') ?? 'uploads';
    this.uploadsRoot = resolve(dir);
  }

  async saveUploaded(
    file: Express.Multer.File,
    uploadedByUserId: string | undefined,
  ): Promise<{
    id: string;
    nombreOriginal: string;
    mimeType: string;
    tamanoBytes: number;
    url: string;
  }> {
    if (!file.buffer?.length) {
      throw new BadRequestException('Archivo vacío');
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('El archivo supera el tamaño máximo permitido');
    }

    const now = new Date();
    const yearMonth = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
    const ext = extname(file.originalname) || '';
    const id = randomUUID();
    const fileName = `${id}${ext}`;
    const rutaRelativa = `${yearMonth}/${fileName}`;
    const fullPath = join(this.uploadsRoot, rutaRelativa);

    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, file.buffer);

    const row = await this.prisma.archivo.create({
      data: {
        id,
        nombreOriginal: file.originalname.slice(0, 500),
        mimeType: (file.mimetype || 'application/octet-stream').slice(0, 200),
        tamanoBytes: file.size,
        rutaRelativa,
        uploadedByUserId: uploadedByUserId ?? null,
      },
    });

    return {
      id: row.id,
      nombreOriginal: row.nombreOriginal,
      mimeType: row.mimeType,
      tamanoBytes: row.tamanoBytes,
      url: `/api/files/${row.id}`,
    };
  }

  async getForStream(id: string): Promise<{
    absPath: string;
    mimeType: string;
    nombreOriginal: string;
  }> {
    const row = await this.prisma.archivo.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException('Archivo no encontrado');
    }
    const absPath = join(this.uploadsRoot, row.rutaRelativa);
    if (!existsSync(absPath)) {
      throw new NotFoundException('Archivo no encontrado en almacenamiento');
    }
    return {
      absPath,
      mimeType: row.mimeType,
      nombreOriginal: row.nombreOriginal,
    };
  }

  createReadStreamForId(id: string) {
    return this.getForStream(id).then((m) => ({
      stream: createReadStream(m.absPath),
      mimeType: m.mimeType,
      nombreOriginal: m.nombreOriginal,
    }));
  }
}
