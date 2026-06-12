import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { MaestroListQueryDto } from '../../common/dto/maestro-list-query.dto';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { CreatePharmaceuticalFormDto } from './dto/create-pharmaceutical-form.dto';
import { UpdatePharmaceuticalFormDto } from './dto/update-pharmaceutical-form.dto';
import { PharmaceuticalFormsService } from './pharmaceutical-forms.service';

@ApiTags('pharmaceutical-forms')
@ApiBearerAuth()
@Controller('pharmaceutical-forms')
export class PharmaceuticalFormsController {
  constructor(private readonly pharmaceuticalFormsService: PharmaceuticalFormsService) {}

  @Get()
  @RequirePermissions('pharma-forms.read', 'nav.formas_farmaceuticas')
  findAll(@Query() query: MaestroListQueryDto) {
    return this.pharmaceuticalFormsService.findAll(query);
  }

  @Post()
  @RequirePermissions('pharma-forms.write')
  @ApiBody({ type: CreatePharmaceuticalFormDto })
  create(@Body() dto: CreatePharmaceuticalFormDto, @CurrentUser() actor: JwtRequestUser) {
    return this.pharmaceuticalFormsService.create(dto, actor.sub);
  }

  @Patch(':id')
  @RequirePermissions('pharma-forms.write')
  @ApiParam({ name: 'id', format: 'uuid' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePharmaceuticalFormDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.pharmaceuticalFormsService.update(id, dto, actor.sub);
  }

  @Delete(':id')
  @RequirePermissions('pharma-forms.write')
  @ApiParam({ name: 'id', format: 'uuid' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.pharmaceuticalFormsService.remove(id, actor.sub);
  }
}
