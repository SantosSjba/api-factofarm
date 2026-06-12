import type { UserRole } from '../../../generated/prisma/client';

export type AuthJwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
  establecimientoId: string;
  permissionCodes: string[];
};

export type JwtRequestUser = AuthJwtPayload;

export type AuthUserView = {
  id: string;
  nombre: string;
  email: string;
  role: UserRole;
  establecimientoId: string;
  permissionCodes: string[];
};

export type AuthTokensView = {
  accessToken: string;
  refreshToken: string;
  user: AuthUserView;
};
