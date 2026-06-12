import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream, existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, extname, join, resolve } from 'path';
import { randomUUID } from 'crypto';
import type { Express } from 'express';

@Injectable()
export class LocalDiskFileStorage {
  private readonly uploadsRoot: string;

  constructor(config: ConfigService) {
    const dir = config.get<string>('UPLOADS_DIR') ?? 'uploads';
    this.uploadsRoot = resolve(dir);
  }

  async saveBuffer(
    file: Express.Multer.File,
  ): Promise<{ id: string; rutaRelativa: string; ext: string }> {
    return this.saveRawBuffer(file.buffer, file.originalname);
  }

  async saveRawBuffer(
    buffer: Buffer,
    originalName: string,
  ): Promise<{ id: string; rutaRelativa: string; ext: string }> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
    const ext = extname(originalName) || '';
    const id = randomUUID();
    const fileName = `${id}${ext}`;
    const rutaRelativa = `${yearMonth}/${fileName}`;
    const fullPath = join(this.uploadsRoot, rutaRelativa);

    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, buffer);

    return { id, rutaRelativa, ext };
  }

  resolveAbsolutePath(rutaRelativa: string): string {
    return join(this.uploadsRoot, rutaRelativa);
  }

  exists(rutaRelativa: string): boolean {
    return existsSync(this.resolveAbsolutePath(rutaRelativa));
  }

  createReadStream(rutaRelativa: string) {
    return createReadStream(this.resolveAbsolutePath(rutaRelativa));
  }
}
