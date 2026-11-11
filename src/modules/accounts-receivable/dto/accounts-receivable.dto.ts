import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class AccountReceivableListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ description: 'PENDIENTE, PARCIAL, VENCIDA, PAGADA, ANULADA o ABIERTA (por cobrar)' })
  @IsOptional()
  @IsString()
  estado?: string;

  @ApiPropertyOptional({ description: 'Cliente (nombre o documento) o número de documento' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}

export class RegisterAccountReceivablePaymentDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  amount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  metodo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  referencia?: string;
}
