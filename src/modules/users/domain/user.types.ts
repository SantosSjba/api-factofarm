import type {
  IdentityDocumentType,
  UserRole,
} from '../../../generated/prisma/client';

export type UserProfileSnapshot = {
  tipoDocumento: IdentityDocumentType | null;
  numeroDocumento: string | null;
  nombres: string | null;
  apellidos: string | null;
  fechaNacimiento: Date | null;
  emailPersonal: string | null;
  direccion: string | null;
  celularPersonal: string | null;
  emailCorporativo: string | null;
  celularCorporativo: string | null;
  fechaContratacion: Date | null;
  cargo: string | null;
  fotoArchivoId: string | null;
  fotoUrl: string | null;
};

export type UserSnapshot = {
  id: string;
  nombre: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
  establecimientoId: string;
  establecimientoNombre: string;
  /** Códigos `Permission.code` asignados (menú y RBAC). */
  permissionCodes: string[];
  profile: UserProfileSnapshot | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserInput = {
  nombre: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  tenantId: string | null;
  establecimientoId: string;
  profile?: Partial<UserProfileSnapshot>;
  permissionCodes?: string[];
};

export type UpdateUserInput = {
  nombre?: string;
  email?: string;
  passwordHash?: string;
  role?: UserRole;
  establecimientoId?: string;
  profile?: Partial<UserProfileSnapshot>;
  permissionCodes?: string[];
};

export type UserListFilters = {
  search?: string;
  role?: UserRole;
  tenantId?: string;
  establishmentId?: string;
  page?: number;
  pageSize?: number;
};

/** Conteos para la fila de resumen de la pantalla Usuarios. */
export type UserSummary = {
  total: number;
  byRole: { role: UserRole; count: number }[];
  byEstablishment: { id: string; nombre: string; count: number }[];
  /** Usuarios con al menos una caja abierta ahora. */
  withOpenCash: number;
};
