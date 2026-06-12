import { Module } from '@nestjs/common';
import { PERMISSIONS_REPOSITORY } from './domain/permissions.repository';
import { PrismaPermissionsRepository } from './infrastructure/prisma-permissions.repository';
import { PermissionsService } from './application/permissions.service';
import { PermissionsController } from './permissions.controller';

@Module({
  controllers: [PermissionsController],
  providers: [
    PermissionsService,
    { provide: PERMISSIONS_REPOSITORY, useClass: PrismaPermissionsRepository },
  ],
  exports: [PermissionsService],
})
export class PermissionsModule {}
