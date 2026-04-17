import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Catálogo de permisos para la UI (árbol del modal) y futura autorización por menú.
 */
@ApiTags('permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('menu-tree')
  @ApiOperation({
    summary: 'Árbol de permisos alineado con el menú lateral',
    description:
      'Nodo raíz `nav.usuarios_series` con hijos (Usuarios, Establecimientos).',
  })
  async menuTree() {
    return this.prisma.permission.findFirst({
      where: { code: 'nav.usuarios_series' },
      include: {
        children: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }
}
