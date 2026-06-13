import { Module } from '@nestjs/common';
import { TenantsModule } from '../tenants/tenants.module';
import { USER_REPOSITORY } from './domain/user.repository';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { UsersService } from './application/users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [TenantsModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
