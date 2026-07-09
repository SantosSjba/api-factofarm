import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { FilesService } from './application/files.service';
import { UploadFileResponseDto } from './application/dto/upload-file-response.dto';

@ApiTags('files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiOkResponse({ type: UploadFileResponseDto })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: JwtRequestUser,
  ): Promise<UploadFileResponseDto> {
    if (!file) {
      throw new BadRequestException('Se requiere un archivo en el campo `file`');
    }
    return this.files.saveUploaded(file, user);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Cuerpo binario del archivo (p. ej. imagen)' })
  async download(
    @Param('id') id: string,
    @CurrentUser() actor: JwtRequestUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const meta = await this.files.createReadStreamForId(id, actor);
    res.setHeader('Content-Type', meta.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename*=UTF-8''${encodeURIComponent(meta.nombreOriginal)}`,
    );
    return new StreamableFile(meta.stream);
  }
}
