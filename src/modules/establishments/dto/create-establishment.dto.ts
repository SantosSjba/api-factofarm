import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import {
  InventoryLotAllocationMethod,
  InventoryValuationMethod,
} from '../../../generated/prisma/client';

export class CreateEstablishmentDto {
  @ApiProperty({ example: 'Oficina Principal', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  nombre!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Cliente SaaS (obligatorio para plataforma)' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ example: '0000', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  codigo?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiPropertyOptional({ example: 'PERU', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  pais?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  provinceId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  districtId?: string;

  @ApiPropertyOptional({ maxLength: 250 })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  direccionFiscal?: string;

  @ApiPropertyOptional({ maxLength: 250 })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  direccionComercial?: string;

  @ApiPropertyOptional({ maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsEmail()
  correoContacto?: string;

  @ApiPropertyOptional({ example: 'https://empresa.pe' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(250)
  direccionWeb?: string;

  @ApiPropertyOptional({ maxLength: 250 })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  informacionAdicional?: string;

  @ApiPropertyOptional({ maxLength: 250 })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  urlImpresora?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nombreImpresora?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  clienteDefault?: string;

  @ApiPropertyOptional({ description: 'Id del archivo/logo subido (módulo files)' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  logoArchivoId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  sujetoIgv31556?: boolean;

  @ApiPropertyOptional({ default: false, description: 'Modo hospital/microred' })
  @IsOptional()
  @IsBoolean()
  esHospital?: boolean;

  @ApiPropertyOptional({ enum: InventoryValuationMethod, default: InventoryValuationMethod.PEPS })
  @IsOptional()
  @IsEnum(InventoryValuationMethod)
  inventoryValuationMethod?: InventoryValuationMethod;

  @ApiPropertyOptional({ enum: InventoryLotAllocationMethod, default: InventoryLotAllocationMethod.FEFO })
  @IsOptional()
  @IsEnum(InventoryLotAllocationMethod)
  inventoryLotAllocationMethod?: InventoryLotAllocationMethod;

  @ApiPropertyOptional({ default: true, description: 'Bloquear venta de lotes vencidos' })
  @IsOptional()
  @IsBoolean()
  blockExpiredProductSales?: boolean;

  @ApiPropertyOptional({ default: 50, description: 'Umbral de ajuste que requiere segunda autorización' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  adjustmentQtyThreshold?: number;

  @ApiPropertyOptional({ maxLength: 40, description: 'Número registro DIGEMID del local' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  numeroRegistroDigemid?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Farmacéutico titular' })
  @IsOptional()
  @IsUUID()
  titularPharmacistLicenseId?: string;

  @ApiPropertyOptional({ default: false, description: 'Bloquear ventas sobre precio regulado DIGEMED' })
  @IsOptional()
  @IsBoolean()
  blockSalesAboveRegulatedPrice?: boolean;

  @ApiPropertyOptional({
    maxLength: 20,
    description: 'Número Yape del local (9 dígitos, solo informativo en POS)',
    example: '987654321',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' && !value.trim() ? undefined : value))
  @IsString()
  @MaxLength(20)
  @Matches(/^[0-9]{9,15}$/, { message: 'Número Yape inválido (use solo dígitos, 9 a 15)' })
  posYapeNumero?: string;

  @ApiPropertyOptional({
    maxLength: 20,
    description: 'Número Plin del local (9 dígitos, solo informativo en POS)',
    example: '912345678',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' && !value.trim() ? undefined : value))
  @IsString()
  @MaxLength(20)
  @Matches(/^[0-9]{9,15}$/, { message: 'Número Plin inválido (use solo dígitos, 9 a 15)' })
  posPlinNumero?: string;
}
