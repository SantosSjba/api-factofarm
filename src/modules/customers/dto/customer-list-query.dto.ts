import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CustomerListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'all|nombre|numeroDocumento|codigoInterno' })
  @IsOptional()
  @IsIn(['all', 'nombre', 'numeroDocumento', 'codigoInterno'])
  field?: 'all' | 'nombre' | 'numeroDocumento' | 'codigoInterno';

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  customerTypeId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @ApiPropertyOptional({ description: 'all|habilitado|inhabilitado' })
  @IsOptional()
  @IsIn(['all', 'habilitado', 'inhabilitado'])
  estado?: 'all' | 'habilitado' | 'inhabilitado';

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
