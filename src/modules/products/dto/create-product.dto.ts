import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PresentationDefaultPrice } from '../../../generated/prisma/enums';

export class ProductWarehousePriceInputDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  warehouseId!: string;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  precio!: number;
}

export class ProductWarehouseStockInputDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  warehouseId!: string;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  cantidad!: number;
}

export class ProductPresentationInputDto {
  @ApiPropertyOptional({ maximum: 60 })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  codigoBarra?: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  unitId!: string;

  @ApiPropertyOptional({ maximum: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  factor?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  precio1?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  precio2?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  precio3?: number;

  @ApiPropertyOptional({ enum: PresentationDefaultPrice, default: PresentationDefaultPrice.PRECIO_1 })
  @IsOptional()
  @IsEnum(PresentationDefaultPrice)
  precioDefecto?: PresentationDefaultPrice;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  precioPuntos?: number;
}

export class ProductAttributeInputDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  attributeTypeId!: string;

  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MaxLength(500)
  descripcion!: string;
}

export class CreateProductDto {
  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  nombre!: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descripcion?: string;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  principioActivo?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  concentracion?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  registroSanitario?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  formaFarmaceutica?: string;

  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  codigoBusqueda?: string;

  @ApiPropertyOptional({ maxLength: 60 })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  codigoInterno?: string;

  @ApiPropertyOptional({ maxLength: 60 })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  codigoBarra?: string;

  @ApiPropertyOptional({ maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  codigoSunat?: string;

  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  codigoMedicamentoDigemid?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lineaProducto?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  modelo?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  marcaLaboratorio?: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  unitId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  currencyId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  saleTaxAffectationId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
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

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  incluyeIgvVenta?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  incluyeIgvCompra?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  generico?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  necesitaRecetaMedica?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  calcularCantidadPorPrecio?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  manejaLotes?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  incluyeIscVenta?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  incluyeIscCompra?: boolean;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tipoSistemaIscId?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  porcentajeIsc?: number;

  @ApiPropertyOptional({ maxLength: 60 })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  codigoLote?: string;

  @ApiPropertyOptional({ description: 'Fecha de vencimiento del lote en formato ISO' })
  @IsOptional()
  @IsString()
  fechaVencimientoLote?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  sujetoDetraccion?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  sePuedeCanjearPorPuntos?: boolean;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  numeroPuntos?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  aplicaGanancia?: boolean;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  porcentajeGanancia?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costoUnitario?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stockMinimo?: number;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  productLocationId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  defaultWarehouseId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  imagenArchivoId?: string;

  @ApiPropertyOptional({ type: [ProductWarehousePriceInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductWarehousePriceInputDto)
  warehousePrices?: ProductWarehousePriceInputDto[];

  @ApiPropertyOptional({ type: [ProductWarehouseStockInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductWarehouseStockInputDto)
  warehouseStocks?: ProductWarehouseStockInputDto[];

  @ApiPropertyOptional({ type: [ProductPresentationInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductPresentationInputDto)
  presentations?: ProductPresentationInputDto[];

  @ApiPropertyOptional({ type: [ProductAttributeInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeInputDto)
  attributes?: ProductAttributeInputDto[];
}
