import type { UserRole } from '../../../generated/prisma/client';

export type AuthJwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
  establecimientoId: string;
  permissionCodes: string[];
  /** Sesión de soporte FactoSys dentro de un tenant SaaS. */
  supportSession?: boolean;
};

export type JwtRequestUser = AuthJwtPayload;

export type AuthUserView = {
  id: string;
  nombre: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
  tenantNombre?: string | null;
  tenantStatus?: string | null;
  establecimientoId: string;
  permissionCodes: string[];
  supportSession?: boolean;
};

export type AuthTokensView = {
  accessToken: string;
  refreshToken: string;
  user: AuthUserView;
};

export type PanelHandoffCreateView = {
  exchangeCode: string;
  tenantId: string;
  tenantNombre: string;
  expiresInSeconds: number;
};
