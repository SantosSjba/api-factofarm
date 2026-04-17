import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IdentityDocumentType } from '../../../../generated/prisma/client';

/** Campos pestaña "Datos personales" (opcionales; completar según negocio). */
export class UserProfileDto {
  @ApiPropertyOptional({ enum: IdentityDocumentType })
  @IsOptional()
  @IsEnum(IdentityDocumentType)
  tipoDocumento?: IdentityDocumentType;

  @ApiPropertyOptional({ maxLength: 32 })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  numeroDocumento?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nombres?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  apellidos?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaNacimiento?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  emailPersonal?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  direccion?: string;

  @ApiPropertyOptional({ maxLength: 32 })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  celularPersonal?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  emailCorporativo?: string;

  @ApiPropertyOptional({ maxLength: 32 })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  celularCorporativo?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaContratacion?: Date;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  cargo?: string;

  @ApiPropertyOptional({ maxLength: 2048, description: 'URL o ruta de foto (legado / externa)' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  fotoUrl?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Id en tabla `archivos` (POST /api/files/upload). Omitir sin cambios; `null` desvincula la foto.',
  })
  @ValidateIf((_, v) => v !== undefined && v !== null)
  @IsUUID()
  fotoArchivoId?: string | null;
}
