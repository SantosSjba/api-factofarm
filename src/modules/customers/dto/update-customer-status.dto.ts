import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateCustomerStatusDto {
  @ApiProperty()
  @IsBoolean()
  habilitado!: boolean;
}
