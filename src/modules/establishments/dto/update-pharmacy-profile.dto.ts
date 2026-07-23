import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { BillingProviderType, SalePdfFormat } from '../../../generated/prisma/client';

/** Actualización del perfil comercial/fiscal + OSE del establecimiento activo. */
export class UpdatePharmacyProfileDto {
  @ApiPropertyOptional({ description: 'Nombre comercial del local' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  codigo?: string;

  @ApiPropertyOptional({ description: 'RUC emisor SUNAT (11 dígitos)' })
  @IsOptional()
  @IsString()
  @MaxLength(11)
  rucEmisor?: string;

  @ApiPropertyOptional({ description: 'Razón social del emisor' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  razonSocialEmisor?: string;

  @ApiPropertyOptional({
    enum: BillingProviderType,
    description: 'MOCK = sin OSE (solo notas de venta). FACTILIZA / NUBEFACT = CPE.',
  })
  @IsOptional()
  @IsEnum(BillingProviderType)
  billingProvider?: BillingProviderType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  apiUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  consultaApiUrl?: string;

  @ApiPropertyOptional({ description: 'Token API OSE en texto plano; se guarda encriptado' })
  @IsOptional()
  @IsString()
  apiToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  modoSandbox?: boolean;

  @ApiPropertyOptional({ description: 'Emitir boleta/factura automáticamente al vender' })
  @IsOptional()
  @IsBoolean()
  autoEmitOnSale?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emitNotaVenta?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  applyDetraccion?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoEmitGuiaOnTransfer?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  direccionFiscal?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  direccionComercial?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  telefono?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  correoContacto?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  direccionWeb?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  informacionAdicional?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  departmentId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  provinceId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  districtId?: string | null;

  @ApiPropertyOptional({
    description: 'Id de archivo (POST /files/upload). `null` quita el logo.',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUUID()
  logoArchivoId?: string | null;

  @ApiPropertyOptional({
    enum: SalePdfFormat,
    description:
      'Formato del PDF interno (nota de venta / voucher). No cambia el PDF oficial del OSE.',
  })
  @IsOptional()
  @IsEnum(SalePdfFormat)
  salePdfFormat?: SalePdfFormat;

  @ApiPropertyOptional({
    description:
      'Zona horaria IANA del local (ej. America/Lima). Afecta reportes, dashboard y PDFs.',
    example: 'America/Lima',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timeZone?: string;

  @ApiPropertyOptional({ description: 'Número de registro DIGEMID del establecimiento' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  numeroRegistroDigemid?: string | null;
}
