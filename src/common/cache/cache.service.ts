import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type RedisClientType } from 'redis';
import { namespacedCacheKey } from './cache-key.util';

type CacheEntry<T> = { value: T; expiresAt: number };

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTtlMs: number;
  private readonly keyPrefix: string;
  private readonly redis?: RedisClientType;
  private sweeper: ReturnType<typeof setInterval> | null = null;

  constructor(config: ConfigService) {
    this.defaultTtlMs = config.get<number>('CACHE_TTL_MS', 300_000);
    this.keyPrefix = config.get<string>('REDIS_KEY_PREFIX')?.trim() || 'factofarm';
    const redisUrl = config.get<string>('REDIS_URL')?.trim();
    if (redisUrl) {
      this.redis = createClient({ url: redisUrl });
      this.redis.on('error', (err) => this.logger.warn(`Redis: ${err.message}`));
      void this.redis
        .connect()
        .then(() => this.logger.log(`Redis cache listo (prefijo ${this.keyPrefix}:)`))
        .catch((err) => {
          this.logger.warn(`Redis no disponible, fallback memoria: ${err.message}`);
        });
    }
    this.sweeper = setInterval(() => this.evictExpired(), 60_000);
  }

  private k(key: string): string {
    return namespacedCacheKey(this.keyPrefix, key);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.sweeper) clearInterval(this.sweeper);
    if (this.redis?.isOpen) await this.redis.quit();
  }

  async get<T>(key: string): Promise<T | undefined> {
    const namespaced = this.k(key);
    if (this.redis?.isOpen) {
      const raw = await this.redis.get(namespaced);
      if (raw == null) return undefined;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return undefined;
      }
    }
    const entry = this.store.get(namespaced);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(namespaced);
      return undefined;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlMs = this.defaultTtlMs): Promise<void> {
    if (this.redis?.isOpen) {
      await this.redis.set(this.k(key), JSON.stringify(value), { PX: ttlMs });
      return;
    }
    this.store.set(this.k(key), { value, expiresAt: Date.now() + ttlMs });
  }

  async delete(key: string): Promise<void> {
    const namespaced = this.k(key);
    if (this.redis?.isOpen) {
      await this.redis.del(namespaced);
    }
    this.store.delete(namespaced);
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
