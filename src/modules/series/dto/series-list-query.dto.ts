import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class SeriesListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['all', 'serie', 'producto', 'estado'] })
  @IsOptional()
  @IsIn(['all', 'serie', 'producto', 'estado'])
  field?: 'all' | 'serie' | 'producto' | 'estado';

  /** Filtro por estado (chips del resumen). */
  @ApiPropertyOptional({ enum: ['DISPONIBLE', 'RESERVADO', 'VENDIDO', 'ANULADO'] })
  @IsOptional()
  @IsIn(['DISPONIBLE', 'RESERVADO', 'VENDIDO', 'ANULADO'])
  estado?: 'DISPONIBLE' | 'RESERVADO' | 'VENDIDO' | 'ANULADO';

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
