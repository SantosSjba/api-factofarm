import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export enum SaleLotAllocationMode {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
}

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

export class SaleLotAllocationPreviewDto {
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
}
