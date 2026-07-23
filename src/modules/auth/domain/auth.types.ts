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
  /** Logo del establecimiento activo (`/api/v1/files/:id`), si existe. */
  logoUrl?: string | null;
  /** Zona horaria IANA del establecimiento activo (default America/Lima). */
  timeZone: string;
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
