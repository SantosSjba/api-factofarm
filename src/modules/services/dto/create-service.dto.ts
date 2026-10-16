import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ServiceAttributeInputDto {
  @ApiProperty()
  @IsUUID()
  attributeTypeId!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  descripcion!: string;
}

export class CreateServiceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  nombre!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descripcion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  principioActivo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  concentracion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  registroSanitario?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  formaFarmaceutica?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  codigoBusqueda?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  codigoInterno?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  codigoBarra?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  codigoSunat?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  codigoMedicamentoDigemid?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lineaProducto?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  modelo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  marcaLaboratorio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @ApiProperty()
  @IsUUID()
  currencyId!: string;

  @ApiProperty()
  @IsUUID()
  saleTaxAffectationId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  purchaseTaxAffectationId?: string;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  precioUnitarioVenta!: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  precioUnitarioCompra?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  incluyeIgvVenta?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  incluyeIgvCompra?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  generico?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  necesitaRecetaMedica?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  incluyeIscVenta?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  incluyeIscCompra?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tipoSistemaIscId?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  porcentajeIsc?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sujetoDetraccion?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sePuedeCanjearPorPuntos?: boolean;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  numeroPuntos?: number;

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
  productLocationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  imagenArchivoId?: string;

  @ApiPropertyOptional({ type: [ServiceAttributeInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceAttributeInputDto)
  attributes?: ServiceAttributeInputDto[];
}
