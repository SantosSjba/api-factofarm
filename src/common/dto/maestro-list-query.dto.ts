import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from './pagination.dto';

/** Listado paginado de maestros simples (categorías, marcas, tipos de cliente). */
export class MaestroListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['all', 'nombre', 'descripcion'] })
  @IsOptional()
  @IsIn(['all', 'nombre', 'descripcion'])
  field?: 'all' | 'nombre' | 'descripcion';
}
