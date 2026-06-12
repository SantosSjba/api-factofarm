import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { CashMovementType, PaymentMethod } from '../../../generated/prisma/client';

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
