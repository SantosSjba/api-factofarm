import { ApiProperty } from '@nestjs/swagger';
import { IsHexadecimal, IsString, Length } from 'class-validator';

export class ExchangePanelHandoffDto {
  @ApiProperty({ minLength: 64, maxLength: 64 })
  @IsString()
  @IsHexadecimal()
  @Length(64)
  code!: string;
}
