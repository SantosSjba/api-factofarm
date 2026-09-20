import type { Readable } from 'stream';
import type { Express } from 'express';

/** Puerto de almacenamiento de archivos (disco local o S3/MinIO). */
export const FILE_STORAGE = Symbol('FILE_STORAGE');

export type StoredFileRef = {
  id: string;
  rutaRelativa: string;
  ext: string;
};

export interface IFileStorage {
  saveBuffer(file: Express.Multer.File): Promise<StoredFileRef>;
  saveRawBuffer(buffer: Buffer, originalName: string): Promise<StoredFileRef>;
  exists(rutaRelativa: string): Promise<boolean>;
  createReadStream(rutaRelativa: string): Promise<Readable> | Readable;
  readBuffer(rutaRelativa: string): Promise<Buffer>;
}
