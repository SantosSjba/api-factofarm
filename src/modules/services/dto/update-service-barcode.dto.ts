import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class UpdateServiceBarcodeDto {
  @ApiProperty()
  @IsString()
  @MaxLength(60)
  codigoBarra!: string;
}
