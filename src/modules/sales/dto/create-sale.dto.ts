import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { DiscountType, PaymentMethod, SaleDocumentType } from '../../../generated/prisma/client';
import { SaleLotAllocationMode } from '../../inventory-movements/dto/sale-lot-allocation-preview.dto';

class SaleManualLotDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  lotCode!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  quantity!: number;
}

export class CreateSaleItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  productId!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  quantity!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  unitPrice?: number;

  @ApiPropertyOptional({ enum: DiscountType })
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  discountValue?: number;

  @ApiPropertyOptional({ enum: SaleLotAllocationMode })
  @IsOptional()
  @IsEnum(SaleLotAllocationMode)
  lotAllocationMode?: SaleLotAllocationMode;

  @ApiPropertyOptional({ type: [SaleManualLotDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleManualLotDto)
  manualLots?: SaleManualLotDto[];
}

class CreatePaymentDto {
  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  metodo!: PaymentMethod;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  monto!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  referencia?: string;
}

export class CreateSaleDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  warehouseId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  cashSessionId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiProperty({ enum: SaleDocumentType })
  @IsEnum(SaleDocumentType)
  documentType!: SaleDocumentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  serie?: string;

  @ApiPropertyOptional({ enum: DiscountType })
  @IsOptional()
  @IsEnum(DiscountType)
  saleDiscountType?: DiscountType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  saleDiscountValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  promotionCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  prescriptionValidated?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  prescriptionNote?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  quotationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comentario?: string;

  @ApiProperty({ type: [CreateSaleItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items!: CreateSaleItemDto[];

  @ApiProperty({ type: [CreatePaymentDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePaymentDto)
  payments!: CreatePaymentDto[];
}

export class VoidSaleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}

export class CreateSaleReturnDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  motivo!: string;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  @IsArray()
  @ArrayMinSize(1)
  items!: { saleItemId: string; quantity: number; lotCode?: string }[];
}
