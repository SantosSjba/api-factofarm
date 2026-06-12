import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class InventoryTransferListQueryDto {
  @ApiPropertyOptional({ enum: ['BORRADOR', 'EN_TRANSITO', 'RECIBIDO', 'ANULADO'] })
  @IsOptional()
  @IsIn(['BORRADOR', 'EN_TRANSITO', 'RECIBIDO', 'ANULADO'])
  estado?: 'BORRADOR' | 'EN_TRANSITO' | 'RECIBIDO' | 'ANULADO';

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  establishmentId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;
}
