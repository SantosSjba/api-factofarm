import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService, type HealthResponse } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Comprobación de que el API responde' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({
    summary: 'Estado del servicio y conexión a la base de datos',
    description:
      'Ejecuta `SELECT 1` contra PostgreSQL. Si falla, responde 503 con `database: disconnected`.',
  })
  @ApiOkResponse({ description: 'API y base de datos operativas' })
  getHealth(): Promise<HealthResponse> {
    return this.appService.getHealth();
  }
}
