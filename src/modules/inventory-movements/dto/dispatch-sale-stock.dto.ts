import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
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
import { SaleLotAllocationMode } from './sale-lot-allocation-preview.dto';

class ManualSaleLotLineDto {
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

export class DispatchSaleStockDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  warehouseId!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  quantity!: number;

  @ApiProperty({ enum: SaleLotAllocationMode, default: SaleLotAllocationMode.AUTO })
  @IsEnum(SaleLotAllocationMode)
  mode: SaleLotAllocationMode = SaleLotAllocationMode.AUTO;

  @ApiPropertyOptional({ type: [ManualSaleLotLineDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ManualSaleLotLineDto)
  manualLots?: ManualSaleLotLineDto[];

  @ApiPropertyOptional({ description: 'Referencia de venta (ej. número de comprobante)' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  comment?: string;
}
