import { Pool } from 'pg';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: Pool;
  private poolEnded = false;

  constructor(config: ConfigService) {
    const connectionString = config.getOrThrow<string>('DATABASE_URL');
    const pool = new Pool({
      connectionString,
      max: config.get<number>('PG_POOL_MAX', 20),
      idleTimeoutMillis: config.get<number>('PG_POOL_IDLE_MS', 30_000),
      connectionTimeoutMillis: config.get<number>('PG_POOL_CONNECT_MS', 10_000),
      keepAlive: true,
    });
    pool.on('error', (err) => {
      this.logger.warn(`Pool PostgreSQL: ${err.message}`);
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Base de datos PostgreSQL conectada (Prisma + pool).');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    if (process.env.NODE_ENV !== 'test') {
      await this.endPool();
    }
  }

  async endPool(): Promise<void> {
    if (this.poolEnded) return;
    this.poolEnded = true;
    await this.pool.end();
  }
}
