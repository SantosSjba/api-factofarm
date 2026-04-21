import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';

export type HealthResponse = {
  status: 'ok';
  database: 'connected';
  /** Puerto configurado (variable `PORT`, por defecto 3000). */
  port: number;
  timestamp: string;
};

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  getHello(): string {
    return 'FactoFarm API OK';
  }

  /** Comprueba que la API responde y que hay conexión real a PostgreSQL. */
  async getHealth(): Promise<HealthResponse> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        database: 'connected',
        port: Number(this.config.get('PORT') ?? 3000),
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'disconnected',
        port: Number(this.config.get('PORT') ?? 3000),
        timestamp: new Date().toISOString(),
      });
    }
  }
}
