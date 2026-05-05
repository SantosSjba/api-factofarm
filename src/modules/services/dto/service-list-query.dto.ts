import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ServiceListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'all|nombre|codigoInterno|codigoBarra|codigoBusqueda|descripcion' })
  @IsOptional()
  @IsIn(['all', 'nombre', 'codigoInterno', 'codigoBarra', 'codigoBusqueda', 'descripcion'])
  field?: 'all' | 'nombre' | 'codigoInterno' | 'codigoBarra' | 'codigoBusqueda' | 'descripcion';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
