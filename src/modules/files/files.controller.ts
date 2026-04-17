import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
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
import { JwtAuthGuard, type JwtRequestUser } from '../auth/jwt-auth.guard';
import type { Request } from 'express';
import { memoryStorage } from 'multer';
import { FilesService } from './application/files.service';
import { UploadFileResponseDto } from './application/dto/upload-file-response.dto';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
    @Req() req: Request & { user?: JwtRequestUser },
  ): Promise<UploadFileResponseDto> {
    if (!file) {
      throw new BadRequestException('Se requiere un archivo en el campo `file`');
    }
    return this.files.saveUploaded(file, req.user?.sub);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Cuerpo binario del archivo (p. ej. imagen)' })
  async download(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const meta = await this.files.createReadStreamForId(id);
    res.setHeader('Content-Type', meta.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename*=UTF-8''${encodeURIComponent(meta.nombreOriginal)}`,
    );
    return new StreamableFile(meta.stream);
  }
}
