import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../../generated/prisma/client';
import { UserProfileDto } from './user-profile.dto';

export class CreateUserDto {
  @ApiProperty({ example: 'María García', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre!: string;

  @ApiProperty({ example: 'maria@empresa.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    minLength: 8,
    maxLength: 128,
    description: 'Contraseña en claro; el API guarda hash (no se devuelve en listados).',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.VENDEDOR })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiProperty({
    format: 'uuid',
    description: 'Id del establecimiento (GET /api/establishments).',
  })
  @IsUUID()
  establecimientoId!: string;

  @ApiPropertyOptional({ type: () => UserProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserProfileDto)
  profile?: UserProfileDto;
}
