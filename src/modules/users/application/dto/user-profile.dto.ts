import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IdentityDocumentType } from '../../../../generated/prisma/client';
import { IsPeruDocument } from '../../../../common/validators/is-peru-document.decorator';

/** Campos pestaña "Datos personales" (opcionales; completar según negocio). */
export class UserProfileDto {
  @ApiPropertyOptional({ enum: IdentityDocumentType })
  @IsOptional()
  @IsEnum(IdentityDocumentType)
  tipoDocumento?: IdentityDocumentType;

  @ApiPropertyOptional({ maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @IsPeruDocument()
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

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  emailPersonal?: string;

  @ApiPropertyOptional({ maxLength: 250 })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  direccion?: string;

  @ApiPropertyOptional({ maxLength: 30 })
  @ValidateIf((_, v) => v != null && String(v).trim() !== '')
  @IsString()
  @MaxLength(30)
  @Matches(/^\+?\d{7,15}$/, {
    message: 'Celular personal no válido (use dígitos, 7 a 15).',
  })
  celularPersonal?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  emailCorporativo?: string;

  @ApiPropertyOptional({ maxLength: 30 })
  @ValidateIf((_, v) => v != null && String(v).trim() !== '')
  @IsString()
  @MaxLength(30)
  @Matches(/^\+?\d{7,15}$/, {
    message: 'Celular corporativo no válido (use dígitos, 7 a 15).',
  })
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

  @ApiPropertyOptional({
    maxLength: 2048,
    description: 'URL o ruta de foto (legado / externa)',
  })
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
