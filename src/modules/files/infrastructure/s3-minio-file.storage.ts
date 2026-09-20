import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import type { Readable } from 'stream';
import type { Express } from 'express';
import {
  DEFAULT_TIME_ZONE,
  formatDateYmdInTimeZone,
} from '../../../common/utils/timezone.util';
import type { IFileStorage, StoredFileRef } from '../domain/file.storage';

@Injectable()
export class S3MinioFileStorage implements IFileStorage {
  private readonly logger = new Logger(S3MinioFileStorage.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly prefix: string;
  private bucketReady: Promise<void>;

  constructor(config: ConfigService) {
    const endpoint = (config.get<string>('S3_ENDPOINT') ?? '').replace(/\/$/, '');
    const region = config.get<string>('S3_REGION') ?? 'us-east-1';
    const accessKeyId = config.get<string>('S3_ACCESS_KEY') ?? '';
    const secretAccessKey = config.get<string>('S3_SECRET_KEY') ?? '';
    this.bucket = config.get<string>('S3_BUCKET') ?? 'factofarm';
    this.prefix = (config.get<string>('S3_KEY_PREFIX') ?? 'uploads').replace(
      /^\/+|\/+$/g,
      '',
    );

    this.client = new S3Client({
      region,
      endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    });
    this.bucketReady = this.ensureBucket();
  }

  private async ensureBucket(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`MinIO/S3 bucket listo: ${this.bucket}`);
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`MinIO/S3 bucket creado: ${this.bucket}`);
      } catch (err) {
        this.logger.warn(
          `No se pudo verificar/crear bucket ${this.bucket}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }
  }

  async saveBuffer(file: Express.Multer.File): Promise<StoredFileRef> {
    return this.saveRawBuffer(file.buffer, file.originalname);
  }

  async saveRawBuffer(
    buffer: Buffer,
    originalName: string,
  ): Promise<StoredFileRef> {
    await this.bucketReady;
    const ymd = formatDateYmdInTimeZone(new Date(), DEFAULT_TIME_ZONE);
    const yearMonth = `${ymd.slice(0, 4)}/${ymd.slice(5, 7)}`;
    const ext = extname(originalName) || '';
    const id = randomUUID();
    const fileName = `${id}${ext}`;
    const rutaRelativa = `${yearMonth}/${fileName}`;
    const key = this.objectKey(rutaRelativa);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: this.guessMime(ext),
      }),
    );

    return { id, rutaRelativa, ext };
  }

  async exists(rutaRelativa: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: this.objectKey(rutaRelativa),
        }),
      );
      return true;
    } catch {
      return false;
    }
  }

  async createReadStream(rutaRelativa: string): Promise<Readable> {
    const res = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: this.objectKey(rutaRelativa),
      }),
    );
    if (!res.Body) {
      throw new Error(`Objeto vacío en S3: ${rutaRelativa}`);
    }
    return res.Body as Readable;
  }

  async readBuffer(rutaRelativa: string): Promise<Buffer> {
    const stream = await this.createReadStream(rutaRelativa);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  private objectKey(rutaRelativa: string): string {
    const clean = rutaRelativa.replace(/^\/+/, '');
    return this.prefix ? `${this.prefix}/${clean}` : clean;
  }

  private guessMime(ext: string): string {
    const e = ext.toLowerCase();
    if (e === '.pdf') return 'application/pdf';
    if (e === '.xml') return 'application/xml';
    if (e === '.png') return 'image/png';
    if (e === '.jpg' || e === '.jpeg') return 'image/jpeg';
    if (e === '.webp') return 'image/webp';
    if (e === '.svg') return 'image/svg+xml';
    return 'application/octet-stream';
  }
}
