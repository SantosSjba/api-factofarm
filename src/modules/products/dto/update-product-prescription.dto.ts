import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateProductPrescriptionDto {
  @ApiProperty({ description: 'Si el producto exige receta médica al venderse' })
  @IsBoolean()
  necesitaRecetaMedica!: boolean;
}
