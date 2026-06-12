import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { CreateUserDto } from './application/dto/create-user.dto';
import { UpdateUserDto } from './application/dto/update-user.dto';
import { UpdateUserPermissionsDto } from './application/dto/update-user-permissions.dto';
import { UserListQueryDto } from './application/dto/user-list-query.dto';
import { UsersService } from './application/users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions('users.write')
  @ApiOperation({ summary: 'Crear usuario (cuenta + perfil opcional)' })
  @ApiBody({ type: CreateUserDto })
  create(@Body() dto: CreateUserDto, @CurrentUser() actor: JwtRequestUser) {
    return this.usersService.create(dto, actor.sub);
  }

  @Get()
  @RequirePermissions('users.read')
  @ApiOperation({ summary: 'Listar usuarios (paginado)' })
  findAll(@Query() query: UserListQueryDto) {
    return this.usersService.findAll({
      search: query.search,
      role: query.role === 'all' ? undefined : query.role,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Get(':id')
  @RequirePermissions('users.read')
  @ApiOperation({ summary: 'Obtener usuario por id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/permissions')
  @RequirePermissions('users.write')
  @ApiOperation({ summary: 'Actualizar permisos del usuario' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateUserPermissionsDto })
  updatePermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserPermissionsDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.usersService.updatePermissions(id, dto.permissionCodes, actor.sub);
  }

  @Patch(':id')
  @RequirePermissions('users.write')
  @ApiOperation({ summary: 'Actualizar usuario' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateUserDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: JwtRequestUser,
  ) {
    return this.usersService.update(id, dto, actor.sub);
  }

  @Delete(':id')
  @RequirePermissions('users.write')
  @ApiOperation({ summary: 'Eliminar usuario (soft delete)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtRequestUser) {
    return this.usersService.remove(id, actor.sub);
  }
}
