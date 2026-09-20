import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { FILE_REPOSITORY } from './domain/file.repository';
import { FILE_STORAGE } from './domain/file.storage';
import type { IFileStorage } from './domain/file.storage';
import { PrismaFileRepository } from './infrastructure/prisma-file.repository';
import { LocalDiskFileStorage } from './infrastructure/local-disk-file.storage';
import { S3MinioFileStorage } from './infrastructure/s3-minio-file.storage';
import { FilesController } from './files.controller';
import { FilesService } from './application/files.service';

function createFileStorage(config: ConfigService): IFileStorage {
  const endpoint = config.get<string>('S3_ENDPOINT')?.trim();
  const accessKey = config.get<string>('S3_ACCESS_KEY')?.trim();
  const secretKey = config.get<string>('S3_SECRET_KEY')?.trim();
  if (endpoint && accessKey && secretKey) {
    return new S3MinioFileStorage(config);
  }
  return new LocalDiskFileStorage(config);
}

@Module({
  imports: [AuthModule, ConfigModule],
  controllers: [FilesController],
  providers: [
    FilesService,
    {
      provide: FILE_STORAGE,
      useFactory: createFileStorage,
      inject: [ConfigService],
    },
    { provide: FILE_REPOSITORY, useClass: PrismaFileRepository },
  ],
  exports: [FilesService, FILE_REPOSITORY, FILE_STORAGE],
})
export class FilesModule {}
