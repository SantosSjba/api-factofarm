import { BooleanField } from '../../../common/decorators/boolean-field.decorator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class ProductListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description:
      'all|nombre|codigoInterno|codigoBarra|codigoBusqueda|descripcion',
  })
  @IsOptional()
  @IsIn([
    'all',
    'nombre',
    'codigoInterno',
    'codigoBarra',
    'codigoBusqueda',
    'descripcion',
  ])
  field?:
    | 'all'
    | 'nombre'
    | 'codigoInterno'
    | 'codigoBarra'
    | 'codigoBusqueda'
    | 'descripcion';

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @BooleanField()
  @IsBoolean()
  habilitado?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @BooleanField()
  @IsBoolean()
  generico?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @BooleanField()
  @IsBoolean()
  necesitaRecetaMedica?: boolean;

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
