import { ApiProperty } from '@nestjs/swagger';

export class UploadFileResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nombreOriginal!: string;

  @ApiProperty()
  mimeType!: string;

  @ApiProperty()
  tamanoBytes!: number;

  /** Ruta bajo el prefijo global `api` (componer con el origen del front: `apiBaseUrl` + path tras quitar `/api` si aplica). */
  @ApiProperty({ example: '/api/files/550e8400-e29b-41d4-a716-446655440000' })
  url!: string;
}
