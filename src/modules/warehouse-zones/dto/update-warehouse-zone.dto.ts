import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { WarehouseZoneType } from '../../../generated/prisma/client';

export class UpdateWarehouseZoneDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @MaxLength(120)
  nombre?: string;

  @ApiPropertyOptional({ enum: WarehouseZoneType })
  @IsOptional()
  @IsEnum(WarehouseZoneType)
  tipo?: WarehouseZoneType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
