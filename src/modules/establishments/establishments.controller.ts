import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

/** Listado para combos (Establecimiento) en formularios de usuario. */
@ApiTags('establishments')
@Controller('establishments')
export class EstablishmentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar establecimientos activos',
    description: 'Uso típico: combos del formulario de usuario.',
  })
  findAll() {
    return this.prisma.establishment.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        nombre: true,
        codigo: true,
      },
    });
  }
}
