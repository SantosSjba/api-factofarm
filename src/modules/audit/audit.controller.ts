import { Controller, Get, Post, Query, Res, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { AuditService } from './audit.service';
import { AuditLogExportQueryDto, AuditLogQueryDto } from './dto/audit-log.dto';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  @RequirePermissions('audit.read', 'nav.usuarios')
  @ApiOperation({ summary: 'Consultar registro de auditoría (compliance)' })
  findAll(@Query() query: AuditLogQueryDto, @CurrentUser() actor: JwtRequestUser) {
    return this.service.findAll(query, actor);
  }

  @Post('export')
  @RequirePermissions('audit.read', 'nav.usuarios')
  @ApiOperation({ summary: 'Exportar auditoría a Excel' })
  async export(
    @Query() query: AuditLogExportQueryDto,
    @CurrentUser() actor: JwtRequestUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const buffer = await this.service.buildExportBuffer(query, actor);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent('auditoria-factofarm.xlsx')}`,
    );
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return new StreamableFile(buffer);
  }
}
