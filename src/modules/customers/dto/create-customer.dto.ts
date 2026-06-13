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
import { IsPeruDocument } from '../../../common/validators/is-peru-document.decorator';
import { CustomerDocumentType } from '../../../generated/prisma/client';
import { CustomerAddressDto } from './customer-address.dto';

export class CreateCustomerDto {
  @ApiProperty({ maxLength: 200, example: 'Juan Pérez García' })
  @IsString()
  @MaxLength(200)
  nombre!: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nombreComercial?: string;

  @ApiProperty({ enum: CustomerDocumentType, example: CustomerDocumentType.DNI })
  @IsEnum(CustomerDocumentType)
  tipoDocumento!: CustomerDocumentType;

  @ApiProperty({ maxLength: 30, example: '45678912' })
  @IsString()
  @MaxLength(30)
  @IsPeruDocument()
  numeroDocumento!: string;

  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  nacionalidad?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  diasCredito?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  limiteCredito?: number;

  @ApiPropertyOptional({ maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  codigoInterno?: string;

  @ApiPropertyOptional({ maxLength: 60 })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  codigoBarra?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observaciones?: string;

  @ApiPropertyOptional({ maxLength: 250 })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  sitioWeb?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  contactoNombre?: string;

  @ApiPropertyOptional({ maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactoTelefono?: string;

  @ApiPropertyOptional({ maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  correoElectronico?: string;

  @ApiPropertyOptional({ maxLength: 250 })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  correosOpcionales?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  puntosAcumulados?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  habilitado?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  etiquetas?: string[];

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  customerTypeId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  vendedorAsignadoId?: string;

  @ApiPropertyOptional({
    description: 'Consentimiento LPDP obligatorio para registro de datos personales',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  lpdpConsentAccepted?: boolean;

  @ApiPropertyOptional({ example: '2026-06-11' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  lpdpConsentVersion?: string;

  @ApiPropertyOptional({ type: () => [CustomerAddressDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerAddressDto)
  addresses?: CustomerAddressDto[];
}
