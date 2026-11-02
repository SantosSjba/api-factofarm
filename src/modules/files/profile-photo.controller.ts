import {
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditLogService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { FilesService } from './application/files.service';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const IMAGE_MIME = /^image\/(png|jpe?g|webp|gif)$/i;

/**
 * Foto de perfil propia: cualquier usuario autenticado puede subirla o quitarla,
 * sin permisos de administración (a diferencia de POST /files/upload).
 * Vive en FilesModule para no crear una dependencia circular con AuthModule.
 */
@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth/me/photo')
export class ProfilePhotoController {
  constructor(
    private readonly files: FilesService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Subir o reemplazar mi foto de perfil (PNG, JPG, WEBP o GIF; máx. 5 MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } }, required: ['file'] },
  })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: MAX_PHOTO_BYTES } }))
  async upload(@UploadedFile() file: Express.Multer.File | undefined, @CurrentUser() actor: JwtRequestUser) {
    this.assertOwnSession(actor);
    if (!file) throw new BadRequestException('Selecciona una imagen para tu foto de perfil.');
    if (!IMAGE_MIME.test(file.mimetype ?? '')) {
      throw new BadRequestException('La foto debe ser una imagen PNG, JPG, WEBP o GIF.');
    }
    const saved = await this.files.saveUploaded(file, actor);
    await this.prisma.userProfile.upsert({
      where: { userId: actor.sub },
      create: { userId: actor.sub, fotoArchivoId: saved.id },
      // La foto subida reemplaza también la URL heredada (la lista de usuarios la prioriza).
      update: { fotoArchivoId: saved.id, fotoUrl: null },
    });
    await this.audit.log({ userId: actor.sub, action: 'UPDATE_PHOTO', entity: 'UserProfile', entityId: actor.sub });
    return { fotoUrl: saved.url };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Quitar mi foto de perfil (se mostrarán mis iniciales)' })
  async remove(@CurrentUser() actor: JwtRequestUser) {
    this.assertOwnSession(actor);
    await this.prisma.userProfile.updateMany({
      where: { userId: actor.sub },
      data: { fotoArchivoId: null, fotoUrl: null },
    });
    await this.audit.log({ userId: actor.sub, action: 'REMOVE_PHOTO', entity: 'UserProfile', entityId: actor.sub });
    return { fotoUrl: null };
  }

  private assertOwnSession(actor: JwtRequestUser) {
    if (actor.supportSession) {
      throw new ForbiddenException('La sesión de soporte no permite cambiar la foto del operador.');
    }
  }
}
