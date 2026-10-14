import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class RequiredPeriodQueryDto {
  @ApiProperty({ example: '2026-10', pattern: '^\\d{4}-(0[1-9]|1[0-2])$' })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'period es obligatorio y debe tener formato YYYY-MM',
  })
  period!: string;
}

export class RequiredLotQueryDto {
  @ApiProperty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1, { message: 'codigoLote es obligatorio' })
  @MaxLength(100)
  codigoLote!: string;
}
