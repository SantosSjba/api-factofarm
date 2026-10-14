import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  ValidateIf,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class UpdateMeDto {
  @ApiPropertyOptional()
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MaxLength(200)
  @MinLength(2)
  nombre?: string;

  @ApiPropertyOptional()
  @ValidateIf((_, value) => value !== undefined)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @MaxLength(254)
  @IsEmail()
  email?: string;
}
