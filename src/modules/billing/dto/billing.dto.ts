import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { BillingProviderType, SunatDocumentStatus } from '../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class UpsertBillingConfigDto {
  @ApiPropertyOptional({ enum: BillingProviderType })
  @IsOptional()
  @IsEnum(BillingProviderType)
  provider?: BillingProviderType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(11)
  rucEmisor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  razonSocialEmisor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  apiUrl?: string;

  @ApiPropertyOptional({ description: 'Token OSE en texto plano; se guarda encriptado' })
  @IsOptional()
  @IsString()
  apiToken?: string;

  @ApiPropertyOptional({ description: 'Certificado .pfx en base64; se guarda encriptado' })
  @IsOptional()
  @IsString()
  certificateBase64?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  certificatePassword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  modoSandbox?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoEmitOnSale?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  consultaApiUrl?: string;

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
}

export class EmitSpecialDocumentDto {
  @ApiProperty({
    enum: ['RETENCION', 'PERCEPCION', 'LIQUIDACION_COMPRA', 'GUIA_REMISION_TRANSPORTISTA'],
  })
  @IsIn(['RETENCION', 'PERCEPCION', 'LIQUIDACION_COMPRA', 'GUIA_REMISION_TRANSPORTISTA'])
  documentType!:
    | 'RETENCION'
    | 'PERCEPCION'
    | 'LIQUIDACION_COMPRA'
    | 'GUIA_REMISION_TRANSPORTISTA';

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  customerNombre!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(20)
  customerDocType!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(20)
  customerDocNumber!: string;

  @ApiProperty()
  @IsString()
  subtotal!: string;

  @ApiProperty()
  @IsString()
  igvTotal!: string;

  @ApiProperty()
  @IsString()
  total!: string;

  @ApiProperty({ type: [Object] })
  lines!: Array<{
    descripcion: string;
    cantidad: string;
    precioUnitario: string;
    subtotalLinea: string;
    igvLinea: string;
    totalLinea: string;
    codigoProducto?: string;
    unidadMedida?: string;
  }>;
}

export class BillingDocumentListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: SunatDocumentStatus })
  @IsOptional()
  @IsEnum(SunatDocumentStatus)
  sunatStatus?: SunatDocumentStatus;
}

export class VoidBillingDocumentDto {
  @ApiProperty()
  @IsString()
  @MaxLength(500)
  reason!: string;
}

export class DailySummaryDto {
  @ApiProperty({ example: '2026-06-12' })
  @IsString()
  fecha!: string;
}

export class EmitFromSaleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
