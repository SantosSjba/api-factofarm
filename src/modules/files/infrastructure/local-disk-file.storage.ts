import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream, existsSync } from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, extname, join, resolve } from 'path';
import { randomUUID } from 'crypto';
import type { Readable } from 'stream';
import type { Express } from 'express';
import {
  DEFAULT_TIME_ZONE,
  formatDateYmdInTimeZone,
} from '../../../common/utils/timezone.util';
import type { IFileStorage, StoredFileRef } from '../domain/file.storage';

@Injectable()
export class LocalDiskFileStorage implements IFileStorage {
  private readonly uploadsRoot: string;

  constructor(config: ConfigService) {
    const dir = config.get<string>('UPLOADS_DIR') ?? 'uploads';
    this.uploadsRoot = resolve(dir);
  }

  async saveBuffer(file: Express.Multer.File): Promise<StoredFileRef> {
    return this.saveRawBuffer(file.buffer, file.originalname);
  }

  async saveRawBuffer(
    buffer: Buffer,
    originalName: string,
  ): Promise<StoredFileRef> {
    const ymd = formatDateYmdInTimeZone(new Date(), DEFAULT_TIME_ZONE);
    const yearMonth = `${ymd.slice(0, 4)}/${ymd.slice(5, 7)}`;
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

  async exists(rutaRelativa: string): Promise<boolean> {
    return existsSync(this.resolveAbsolutePath(rutaRelativa));
  }

  createReadStream(rutaRelativa: string): Readable {
    return createReadStream(this.resolveAbsolutePath(rutaRelativa));
  }

  async readBuffer(rutaRelativa: string): Promise<Buffer> {
    return readFile(this.resolveAbsolutePath(rutaRelativa));
  }
}
