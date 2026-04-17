import type { IdentityDocumentType, UserRole } from '../../../generated/prisma/client';

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
  fotoUrl: string | null;
};

export type UserSnapshot = {
  id: string;
  nombre: string;
  email: string;
  role: UserRole;
  establecimientoId: string;
  profile: UserProfileSnapshot | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserInput = {
  nombre: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  establecimientoId: string;
  profile?: Partial<UserProfileSnapshot>;
};

export type UpdateUserInput = {
  nombre?: string;
  email?: string;
  passwordHash?: string;
  role?: UserRole;
  establecimientoId?: string;
  profile?: Partial<UserProfileSnapshot>;
};
