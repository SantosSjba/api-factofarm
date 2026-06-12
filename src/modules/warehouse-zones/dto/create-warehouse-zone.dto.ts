import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { WarehouseZoneType } from '../../../generated/prisma/client';

export class CreateWarehouseZoneDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  warehouseId!: string;

  @ApiProperty()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @MaxLength(120)
  nombre!: string;

  @ApiProperty({ enum: WarehouseZoneType })
  @IsEnum(WarehouseZoneType)
  tipo!: WarehouseZoneType;
}
