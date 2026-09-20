import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { resolveUserPermissionCodes } from '../tenants/tenant-permissions.util';

const PERMS_CACHE_TTL_MS = 30_000;

/**
 * Live permission codes from DB with short TTL (B-LOG-12).
 * Avoids trusting JWT permissionCodes for the full access-token lifetime.
 */
@Injectable()
export class PermissionsCacheService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async getPermissionCodes(userId: string): Promise<string[]> {
    return this.cache.getOrSet(
      this.cacheKey(userId),
      () => this.loadFromDb(userId),
      PERMS_CACHE_TTL_MS,
    );
  }

  async invalidate(userId: string): Promise<void> {
    await this.cache.delete(this.cacheKey(userId));
  }

  private cacheKey(userId: string): string {
    return `user-perms:${userId}`;
  }

  private async loadFromDb(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        role: true,
        permissions: { select: { permission: { select: { code: true } } } },
        tenant: { select: { plan: true, enabledModules: true } },
      },
    });
    if (!user) return [];

    return resolveUserPermissionCodes({
      role: user.role,
      permissionCodes: user.permissions.map((p) => p.permission.code),
      tenant: user.tenant,
    });
  }
}
