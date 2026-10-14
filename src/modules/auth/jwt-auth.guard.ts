import { PrismaService } from '../../prisma/prisma.service';
import { TenantStatus, UserRole } from '../../generated/prisma/client';
import { resolveUserPermissionCodes } from '../../common/tenants/tenant-permissions.util';
import { expandUserPermissionCodes } from '../../common/permissions/nav-permission-expansion';
import { getDefaultNavCodesForRole } from '../../common/permissions/role-permission-templates';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../../common/constants/metadata.constants';
import type { AuthJwtPayload, JwtRequestUser } from './domain/auth.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtRequestUser }>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Token de acceso requerido',
      });
    }

    const token = header.slice(7);
    let payload: AuthJwtPayload;
    try {
      payload = this.jwtService.verify<AuthJwtPayload>(token);
    } catch {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Sesión inválida o expirada',
      });
    }
    req.user = await this.validateSession(payload);
    return true;
  }

  async validateSession(payload: AuthJwtPayload): Promise<JwtRequestUser> {
    if (!payload.sub) throw new UnauthorizedException();
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
      select: {
        authVersion: true,
        email: true,
        role: true,
        tenantId: true,
        establecimientoId: true,
        establecimiento: { select: { deletedAt: true, activo: true } },
        permissions: { select: { permission: { select: { code: true } } } },
        tenant: {
          select: {
            deletedAt: true,
            status: true,
            plan: true,
            enabledModules: true,
          },
        },
      },
    });
    if (!user || (payload.authVersion ?? 0) !== (user.authVersion ?? 0))
      throw new UnauthorizedException();
    if (payload.supportSession) {
      if (
        user.role !== UserRole.SUPER_ADMIN ||
        !payload.tenantId ||
        ![UserRole.ADMINISTRADOR, UserRole.ADMIN_CADENA].includes(
          payload.role as never,
        )
      )
        throw new UnauthorizedException();
      const establishment = await this.prisma.establishment.findFirst({
        where: {
          id: payload.establecimientoId,
          tenantId: payload.tenantId,
          activo: true,
          deletedAt: null,
        },
        select: {
          tenant: {
            select: {
              deletedAt: true,
              status: true,
              plan: true,
              enabledModules: true,
            },
          },
        },
      });
      const tenant = establishment?.tenant;
      if (
        !tenant ||
        tenant.deletedAt ||
        ![TenantStatus.ACTIVE, TenantStatus.TRIAL].includes(
          tenant.status as never,
        )
      )
        throw new UnauthorizedException();
      return {
        ...payload,
        permissionCodes: resolveUserPermissionCodes({
          role: payload.role,
          permissionCodes: expandUserPermissionCodes(
            getDefaultNavCodesForRole(payload.role),
            payload.role,
          ),
          tenant,
        }),
      };
    }
    if (
      payload.role !== user.role ||
      payload.tenantId !== user.tenantId ||
      payload.establecimientoId !== user.establecimientoId
    )
      throw new UnauthorizedException();
    if (
      user.role !== UserRole.SUPER_ADMIN &&
      (!user.tenantId ||
        !user.tenant ||
        user.tenant.deletedAt ||
        ![TenantStatus.ACTIVE, TenantStatus.TRIAL].includes(
          user.tenant.status as never,
        ) ||
        user.establecimiento.deletedAt ||
        !user.establecimiento.activo)
    )
      throw new UnauthorizedException();
    return {
      ...payload,
      email: user.email,
      permissionCodes: resolveUserPermissionCodes({
        role: user.role,
        permissionCodes: user.permissions.map((p) => p.permission.code),
        tenant: user.tenant,
      }),
    };
  }
}

export type { JwtRequestUser } from './domain/auth.types';
