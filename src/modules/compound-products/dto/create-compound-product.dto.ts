import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CompoundProductItemInputDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiProperty({ minimum: 0.0001 })
  @IsNumber()
  @Min(0.0001)
  cantidad!: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  precioUnitario?: number;
}

export class CreateCompoundProductDto {
  @ApiProperty()
  @IsString()
  @MaxLength(300)
  nombre!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nombreSecundario?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  modelo?: string;

  @ApiProperty()
  @IsUUID()
  unitId!: string;

  @ApiProperty()
  @IsUUID()
  currencyId!: string;

  @ApiProperty()
  @IsUUID()
  saleTaxAffectationId!: string;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  precioUnitarioVenta!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  incluyeIgvVenta?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  plataformaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  codigoSunat?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  codigoInterno?: string;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  precioUnitarioCompra!: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalPrecioCompraReferencia?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  imagenArchivoId?: string;

  @ApiPropertyOptional({ type: [CompoundProductItemInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompoundProductItemInputDto)
  items?: CompoundProductItemInputDto[];
}
