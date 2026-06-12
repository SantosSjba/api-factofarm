import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class UpdateUserPermissionsDto {
  @ApiProperty({
    type: [String],
    example: ['nav.usuarios', 'nav.establecimientos', 'users.read'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissionCodes!: string[];
}
