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
  MaxLength,
  Min,
} from 'class-validator';
import {
  BankAccountType,
  BankMovementType,
} from '../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class FinancePeriodQueryDto {
  @ApiProperty({ example: '2026-01-01' })
  @IsString()
  from!: string;

  @ApiProperty({ example: '2026-01-31' })
  @IsString()
  to!: string;
}

export class AccountingExportQueryDto extends FinancePeriodQueryDto {
  @ApiProperty({ enum: ['contasis', 'siscont', 'excel'] })
  @IsString()
  format!: 'contasis' | 'siscont' | 'excel';
}

export class CreateBankAccountDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  nombre!: string;

  @ApiPropertyOptional({ enum: BankAccountType })
  @IsOptional()
  @IsEnum(BankAccountType)
  tipo?: BankAccountType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  banco?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  numeroCuenta?: string;
}

export class CreateBankMovementDto {
  @ApiProperty()
  @IsString()
  bankAccountId!: string;

  @ApiProperty({ enum: BankMovementType })
  @IsEnum(BankMovementType)
  tipo!: BankMovementType;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;
}

export class BankMovementListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankAccountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  conciliado?: boolean;
}

export class UpsertPurchaseBudgetDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  anio!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  mes!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  montoPresupuestado!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notas?: string;
}

export class PurchaseBudgetReportQueryDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  anio!: number;
}

export class BulkReconcileMovementsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  movementIds!: string[];
}
