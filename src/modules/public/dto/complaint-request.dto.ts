import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export enum ComplaintKind {
  RECLAMO = 'RECLAMO',
  QUEJA = 'QUEJA',
}

export class ComplaintRequestDto {
  @IsEnum(ComplaintKind)
  tipo!: ComplaintKind;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombresApellidos!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  domicilio!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  documentoIdentidad!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  telefono!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  bienContratado!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  montoReclamado?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  detalle!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  pedido!: string;
}
