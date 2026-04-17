import { Module } from '@nestjs/common';
import { EstablishmentsController } from './establishments.controller';

@Module({
  controllers: [EstablishmentsController],
})
export class EstablishmentsModule {}
