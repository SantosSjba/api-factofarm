import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class UpdateCustomerBarcodeDto {
  @ApiProperty({ maxLength: 60 })
  @IsString()
  @MaxLength(60)
  codigoBarra!: string;
}
