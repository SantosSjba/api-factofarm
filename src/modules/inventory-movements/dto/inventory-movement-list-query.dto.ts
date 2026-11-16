import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export type InventoryStockLevel = 'agotado' | 'critico' | 'bajo' | 'normal';

export class InventoryMovementListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['all', 'producto', 'marca', 'almacen'] })
  @IsOptional()
  @IsIn(['all', 'producto', 'marca', 'almacen'])
  field?: 'all' | 'producto' | 'marca' | 'almacen';

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  establishmentId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    enum: ['agotado', 'critico', 'bajo', 'normal'],
    description: 'Nivel de stock de la fila frente al stock mínimo del producto',
  })
  @IsOptional()
  @IsIn(['agotado', 'critico', 'bajo', 'normal'])
  stockLevel?: InventoryStockLevel;

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
