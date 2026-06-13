import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../constants/metadata.constants';
import { hasChainScope } from '../permissions/role-policy.util';
import type { JwtRequestUser } from '../../modules/auth/domain/auth.types';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
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

    if (hasChainScope(user.role)) {
      return true;
    }

    const hasPermission = required.some((code) =>
      user.permissionCodes.includes(code),
    );
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
