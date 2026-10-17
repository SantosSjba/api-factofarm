import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { PermissionsService } from './application/permissions.service';

@ApiTags('permissions')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get('menu-tree')
  @RequirePermissions(
    'users.read',
    'users.write',
    'tenants.read',
    'nav.platform_clientes',
  )
  @ApiOperation({
    summary: 'Árbol de permisos alineado con el menú lateral',
    description:
      'Nodo raíz `nav.usuarios_series` con hijos (Usuarios, Establecimientos). Requiere gestión de usuarios o plataforma.',
  })
  menuTree() {
    return this.permissionsService.menuTree();
  }

  @Get('menu-trees')
  @RequirePermissions(
    'users.read',
    'users.write',
    'tenants.read',
    'nav.platform_clientes',
  )
  @ApiOperation({
    summary: 'Árboles de permisos del menú lateral (Fase 0 + Fase 1)',
    description:
      'Requiere users.read/write o tenants.read / nav.platform_clientes. Devuelve solo los módulos que el actor puede asignar.',
  })
  menuTrees(@CurrentUser() actor: JwtRequestUser) {
    return this.permissionsService.menuTreesFor(actor);
  }

  @Get('role-templates')
  @RequirePermissions(
    'users.read',
    'users.write',
    'tenants.read',
    'nav.platform_clientes',
  )
  @ApiOperation({ summary: 'Plantillas de permisos por rol' })
  roleTemplates() {
    return this.permissionsService.roleTemplates();
  }
}
