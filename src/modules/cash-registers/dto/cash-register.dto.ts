import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
  IsIn,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import {
  CashMovementType,
  CashSessionStatus,
  PaymentMethod,
  PosPrinterPaperWidth,
} from '../../../generated/prisma/client';

export class OpenCashSessionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  cashRegisterId!: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  montoApertura?: number;
}

export class CloseCashSessionDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  montoCierreFisico!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notasCierre?: string;

  @ApiPropertyOptional({
    description:
      'Obligatorio cuando un supervisor cierra la caja abierta por otro usuario',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivoCierreForzado?: string;
}

export class CreateCashMovementDto {
  @ApiProperty({ enum: CashMovementType })
  @IsEnum(CashMovementType)
  tipo!: CashMovementType;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  monto!: number;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  metodoPago?: PaymentMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comentario?: string;
}

export class CreateCashRegisterDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre!: string;
}

export class UpdateCashRegisterHardwareDto {
  @ApiPropertyOptional({
    enum: PosPrinterPaperWidth,
    default: PosPrinterPaperWidth.MM_80,
  })
  @IsOptional()
  @IsEnum(PosPrinterPaperWidth)
  printerPaperWidth?: PosPrinterPaperWidth;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  printerAutoPrint?: boolean;

  @ApiPropertyOptional({
    default: true,
    description: 'Pulso cajón monedero al imprimir (ESC/POS)',
  })
  @IsOptional()
  @IsBoolean()
  openCashDrawerOnPrint?: boolean;

  @ApiPropertyOptional({
    default: true,
    description: 'Escáner USB tipo keyboard wedge',
  })
  @IsOptional()
  @IsBoolean()
  barcodeWedgeEnabled?: boolean;

  @ApiPropertyOptional({
    default: false,
    description: 'Habilitar pantalla cliente / pole display',
  })
  @IsOptional()
  @IsBoolean()
  customerDisplayEnabled?: boolean;

  @ApiPropertyOptional({
    maxLength: 120,
    description: 'Nombre impresora en sistema operativo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  escposPrinterName?: string;
}

export const CASH_DIFFERENCE_FILTERS = [
  'CON_DIFERENCIA',
  'FALTANTE',
  'SOBRANTE',
  'SIN_DIFERENCIA',
] as const;
export type CashDifferenceFilter = (typeof CASH_DIFFERENCE_FILTERS)[number];

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** Filtros del historial de sesiones de caja (también usados por KPIs y exportación). */
export class CashSessionFiltersDto {
  @ApiPropertyOptional({ description: 'Desde (YYYY-MM-DD, fecha de apertura)' })
  @IsOptional()
  @Matches(YMD, { message: 'La fecha "desde" debe tener formato AAAA-MM-DD' })
  from?: string;

  @ApiPropertyOptional({ description: 'Hasta (YYYY-MM-DD, fecha de apertura)' })
  @IsOptional()
  @Matches(YMD, { message: 'La fecha "hasta" debe tener formato AAAA-MM-DD' })
  to?: string;

  @ApiPropertyOptional({
    description:
      'Establecimiento (solo roles de cadena). "ALL" = todos los del cliente.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  establishmentId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Cajero' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  cashRegisterId?: string;

  @ApiPropertyOptional({ enum: CashSessionStatus })
  @IsOptional()
  @IsEnum(CashSessionStatus)
  estado?: CashSessionStatus;

  @ApiPropertyOptional({ enum: CASH_DIFFERENCE_FILTERS })
  @IsOptional()
  @IsIn(CASH_DIFFERENCE_FILTERS)
  diferencia?: CashDifferenceFilter;

  @ApiPropertyOptional({ description: 'Solo cierres forzados' })
  @IsOptional()
  @IsIn(['true', 'false'])
  forzado?: 'true' | 'false';
}

export class ListCashSessionsQueryDto extends CashSessionFiltersDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 15, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number;
}

export class ExportCashSessionsQueryDto extends CashSessionFiltersDto {
  @ApiPropertyOptional({ enum: ['xlsx', 'pdf'], default: 'xlsx' })
  @IsOptional()
  @IsIn(['xlsx', 'pdf'])
  format?: 'xlsx' | 'pdf';
}

export class CashSessionReportQueryDto {
  @ApiPropertyOptional({
    enum: ['a4', 'ticket'],
    default: 'a4',
    description: 'ticket = ancho de papel configurado en la caja',
  })
  @IsOptional()
  @IsIn(['a4', 'ticket'])
  format?: 'a4' | 'ticket';
}
