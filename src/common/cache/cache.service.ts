import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type RedisClientType } from 'redis';

type CacheEntry<T> = { value: T; expiresAt: number };

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTtlMs: number;
  private readonly redis?: RedisClientType;
  private sweeper: ReturnType<typeof setInterval> | null = null;

  constructor(config: ConfigService) {
    this.defaultTtlMs = config.get<number>('CACHE_TTL_MS', 300_000);
    const redisUrl = config.get<string>('REDIS_URL')?.trim();
    if (redisUrl) {
      this.redis = createClient({ url: redisUrl });
      this.redis.on('error', (err) => this.logger.warn(`Redis: ${err.message}`));
      void this.redis.connect().catch((err) => {
        this.logger.warn(`Redis no disponible, fallback memoria: ${err.message}`);
      });
    }
    this.sweeper = setInterval(() => this.evictExpired(), 60_000);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.sweeper) clearInterval(this.sweeper);
    if (this.redis?.isOpen) await this.redis.quit();
  }

  async get<T>(key: string): Promise<T | undefined> {
    if (this.redis?.isOpen) {
      const raw = await this.redis.get(key);
      if (raw == null) return undefined;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return undefined;
      }
    }
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlMs = this.defaultTtlMs): Promise<void> {
    if (this.redis?.isOpen) {
      await this.redis.set(key, JSON.stringify(value), { PX: ttlMs });
      return;
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  async delete(key: string): Promise<void> {
    if (this.redis?.isOpen) {
      await this.redis.del(key);
    }
    this.store.delete(key);
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttlMs?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) return cached;
    const value = await factory();
    await this.set(key, value, ttlMs);
    return value;
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }
}
