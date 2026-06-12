import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionsService } from './application/permissions.service';

@ApiTags('permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get('menu-tree')
  @ApiOperation({
    summary: 'Árbol de permisos alineado con el menú lateral',
    description:
      'Nodo raíz `nav.usuarios_series` con hijos (Usuarios, Establecimientos).',
  })
  menuTree() {
    return this.permissionsService.menuTree();
  }
}
