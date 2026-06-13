import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ArcoRequestStatus, ArcoRequestType, TaxPartyType } from '../../../generated/prisma/client';

export class CreateArcoRequestDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  customerId!: string;

  @ApiProperty({ enum: ArcoRequestType })
  @IsEnum(ArcoRequestType)
  requestType!: ArcoRequestType;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  details?: string;
}

export class ProcessArcoRequestDto {
  @ApiProperty({ enum: ArcoRequestStatus })
  @IsEnum(ArcoRequestStatus)
  status!: ArcoRequestStatus;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  responseNotes?: string;
}

export class CreatePharmacistLicenseDto {
  @ApiProperty({ example: '12345' })
  @IsString()
  @MaxLength(20)
  colegiaturaCqp!: string;

  @ApiProperty({ example: 'María López Quispe' })
  @IsString()
  @MaxLength(200)
  fullName!: string;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsString()
  vigenciaHasta?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class UpdatePharmacistLicenseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  colegiaturaCqp?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  fullName?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  vigenciaHasta?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  userId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class UpsertRegulatedPriceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  codigoDigemid?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(300)
  nombre!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  precioMaximo!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vigenteDesde?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vigenteHasta?: string;

  @ApiPropertyOptional({ default: 'DIGEMED' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  fuente?: string;
}

class RegulatedPriceRowDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  codigoDigemid?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(300)
  nombre!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  precioMaximo!: number;
}

export class ImportRegulatedPricesDto {
  @ApiProperty({ type: [RegulatedPriceRowDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RegulatedPriceRowDto)
  rows!: RegulatedPriceRowDto[];
}

export class CreateTaxWithholdingDto {
  @ApiPropertyOptional({ enum: TaxPartyType })
  @IsOptional()
  @IsEnum(TaxPartyType)
  partyType?: TaxPartyType;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  partyId?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  partyNombre!: string;

  @ApiProperty({ example: '6' })
  @IsString()
  @MaxLength(20)
  partyDocType!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(20)
  partyDocNumber!: string;

  @ApiPropertyOptional({ example: 'RET-03' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  regimenCodigo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  tasa?: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.01)
  baseImponible!: number;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsString()
  fechaOperacion?: string;

  @ApiPropertyOptional({ example: '01' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  comprobanteModificadoTipo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  comprobanteModificadoSerie?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  comprobanteModificadoNumero?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  saleId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  purchaseOrderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observaciones?: string;
}
