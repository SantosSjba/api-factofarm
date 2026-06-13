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
  MaxLength,
  Min,
} from 'class-validator';
import { CashMovementType, PaymentMethod, PosPrinterPaperWidth } from '../../../generated/prisma/client';

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
  @ApiPropertyOptional({ enum: PosPrinterPaperWidth, default: PosPrinterPaperWidth.MM_80 })
  @IsOptional()
  @IsEnum(PosPrinterPaperWidth)
  printerPaperWidth?: PosPrinterPaperWidth;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  printerAutoPrint?: boolean;

  @ApiPropertyOptional({ default: true, description: 'Pulso cajón monedero al imprimir (ESC/POS)' })
  @IsOptional()
  @IsBoolean()
  openCashDrawerOnPrint?: boolean;

  @ApiPropertyOptional({ default: true, description: 'Escáner USB tipo keyboard wedge' })
  @IsOptional()
  @IsBoolean()
  barcodeWedgeEnabled?: boolean;

  @ApiPropertyOptional({ default: false, description: 'Habilitar pantalla cliente / pole display' })
  @IsOptional()
  @IsBoolean()
  customerDisplayEnabled?: boolean;

  @ApiPropertyOptional({ maxLength: 120, description: 'Nombre impresora en sistema operativo' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  escposPrinterName?: string;
}
