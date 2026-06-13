import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ContactRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  farmacia!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  telefono!: string;

  @IsEmail()
  @MaxLength(120)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  mensaje?: string;
}
