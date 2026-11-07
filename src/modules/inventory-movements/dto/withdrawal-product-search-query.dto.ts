import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

/** Búsqueda de productos con stock en un almacén, para registrar su salida. */
export class WithdrawalProductSearchQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  warehouseId!: string;

  @ApiPropertyOptional({ description: 'Nombre, código interno o de barras' })
  @IsOptional()
  @IsString()
  search?: string;
}
