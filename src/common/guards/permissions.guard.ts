import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../constants/metadata.constants';
import { hasChainScope } from '../permissions/role-policy.util';
import { PermissionsCacheService } from '../permissions/permissions-cache.service';
import type { JwtRequestUser } from '../../modules/auth/domain/auth.types';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsCache: PermissionsCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.length) {
      return true;
    }

    const req = context.switchToHttp().getRequest<{ user?: JwtRequestUser }>();
    const user = req.user;
    if (!user) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Acceso denegado',
      });
    }

    // B-LOG-19 intentional: SUPER_ADMIN / ADMINISTRADOR / ADMIN_CADENA bypass.
    if (hasChainScope(user.role)) {
      return true;
    }

    // B-LOG-12: re-check live codes from DB (30s TTL) instead of JWT forever.
    const liveCodes = await this.permissionsCache.getPermissionCodes(user.sub);
    const hasPermission = required.some((code) => liveCodes.includes(code));
    if (!hasPermission) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'No tiene permisos para esta operación',
        details: { required },
      });
    }

    return true;
  }
}
