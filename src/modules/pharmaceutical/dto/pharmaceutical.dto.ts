import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { AdverseEventSeverity } from '../../../generated/prisma/client';

export class CreateAdverseEventDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  descripcion!: string;

  @ApiPropertyOptional({ enum: AdverseEventSeverity })
  @IsOptional()
  @IsEnum(AdverseEventSeverity)
  severidad?: AdverseEventSeverity;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(130)
  pacienteEdad?: number;

  @ApiPropertyOptional({ example: 'F' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  pacienteSexo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reaccionTipo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  cie10Codigo?: string;
}

export class NotifyDigemidAdverseEventDto {
  @ApiProperty()
  @IsString()
  @MaxLength(40)
  digemidReportNumber!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  medidasCorrectivas?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fechaNotificacion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(130)
  pacienteEdad?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  pacienteSexo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reaccionTipo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  cie10Codigo?: string;
}

export class PharmaReportQueryDto {
  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  warehouseId?: string;
}

export class ControlledMonthlyQueryDto {
  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ example: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}

export class ProfitabilityQueryDto extends PharmaReportQueryDto {
  @ApiPropertyOptional({ enum: ['product', 'category', 'laboratory'] })
  @IsOptional()
  @IsString()
  groupBy?: 'product' | 'category' | 'laboratory';
}

export class SalesAnalyticsQueryDto extends PharmaReportQueryDto {
  @ApiPropertyOptional({ enum: ['seller', 'warehouse', 'hour', 'day'] })
  @IsOptional()
  @IsString()
  groupBy?: 'seller' | 'warehouse' | 'hour' | 'day';
}

export class ShrinkageExpiryQueryDto extends PharmaReportQueryDto {
  @ApiPropertyOptional({ example: 90 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  expiryDaysAhead?: number;
}
