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
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  AgreementInstitutionType,
  AgreementType,
} from '../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class AgreementListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  search?: string;

  @ApiPropertyOptional({ enum: AgreementType })
  @IsOptional()
  @IsEnum(AgreementType)
  tipo?: AgreementType;
}

export class CreateAgreementDto {
  @ApiProperty()
  @IsString()
  @MaxLength(40)
  codigo!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  nombre!: string;

  @ApiProperty({ enum: AgreementType })
  @IsEnum(AgreementType)
  tipo!: AgreementType;

  @ApiPropertyOptional({ enum: AgreementInstitutionType })
  @IsOptional()
  @IsEnum(AgreementInstitutionType)
  institucionTipo?: AgreementInstitutionType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  coberturaPorcentaje?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  diasCredito?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactoNombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactoEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactoTelefono?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notas?: string;
}

export class UpdateAgreementDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nombre?: string;

  @ApiPropertyOptional({ enum: AgreementType })
  @IsOptional()
  @IsEnum(AgreementType)
  tipo?: AgreementType;

  @ApiPropertyOptional({ enum: AgreementInstitutionType })
  @IsOptional()
  @IsEnum(AgreementInstitutionType)
  institucionTipo?: AgreementInstitutionType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  coberturaPorcentaje?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  diasCredito?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactoNombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactoEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactoTelefono?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notas?: string;
}

class AgreementProductPriceRowDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  productId!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  precio!: number;
}

export class UpsertAgreementPricesDto {
  @ApiProperty({ type: [AgreementProductPriceRowDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgreementProductPriceRowDto)
  items!: AgreementProductPriceRowDto[];
}

export class AgreementSettlementQueryDto {
  @ApiProperty({ example: '2026-01-01' })
  @IsString()
  from!: string;

  @ApiProperty({ example: '2026-01-31' })
  @IsString()
  to!: string;
}

export class GenerateMonthlyBillingDto {
  @ApiProperty({ example: '2026-06' })
  @IsString()
  @MaxLength(7)
  periodo!: string;
}
