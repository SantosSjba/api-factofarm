import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FILE_REPOSITORY } from './domain/file.repository';
import { PrismaFileRepository } from './infrastructure/prisma-file.repository';
import { LocalDiskFileStorage } from './infrastructure/local-disk-file.storage';
import { FilesController } from './files.controller';
import { FilesService } from './application/files.service';

@Module({
  imports: [AuthModule],
  controllers: [FilesController],
  providers: [
    FilesService,
    LocalDiskFileStorage,
    { provide: FILE_REPOSITORY, useClass: PrismaFileRepository },
  ],
  exports: [FilesService],
})
export class FilesModule {}
