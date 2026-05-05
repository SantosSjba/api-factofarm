import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum } from 'class-validator';
import { ProductSerialStatus } from '../../../generated/prisma/client';

export class UpdateSeriesStatusDto {
  @ApiProperty({ enum: ProductSerialStatus })
  @IsEnum(ProductSerialStatus)
  estado!: ProductSerialStatus;

  @ApiProperty()
  @IsBoolean()
  vendido!: boolean;
}
