import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

/** Migrar nota de venta → boleta o factura electrónica. */
export class ConvertSaleToCpeDto {
  @ApiProperty({ enum: ['BOLETA', 'FACTURA'] })
  @IsIn(['BOLETA', 'FACTURA'])
  documentType!: 'BOLETA' | 'FACTURA';
}
