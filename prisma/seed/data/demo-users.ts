import { UserRole } from '../../../src/generated/prisma/client';

export type DemoEstablishmentCode = '0000' | '0001';

export type DemoUserSeed = {
  email: string;
  passwordPlain: string;
  nombre: string;
  role: UserRole;
  /** Null = plataforma (SUPER_ADMIN). */
  tenantScoped: boolean;
  establishmentCode: DemoEstablishmentCode;
  profile?: {
    tipoDocumento?: 'DNI';
    numeroDocumento: string;
    nombres: string;
    apellidos: string;
    cargo: string;
  };
};

const DOMAIN = 'factosysperu.com';

/** Credenciales demo FactoFarm / FactoSys (desarrollo). Dominio operador: @factosysperu.com */
export const demoUsersSeed: readonly DemoUserSeed[] = [
  {
    email: `superadmin@${DOMAIN}`,
    passwordPlain: 'SuperAdmin123!',
    nombre: 'Super Admin FactoFarm',
    role: UserRole.SUPER_ADMIN,
    tenantScoped: false,
    establishmentCode: '0000',
  },
  {
    email: `platform@${DOMAIN}`,
    passwordPlain: 'Platform123!',
    nombre: 'Operador Plataforma',
    role: UserRole.SUPER_ADMIN,
    tenantScoped: false,
    establishmentCode: '0000',
  },
  {
    email: `admin@${DOMAIN}`,
    passwordPlain: 'Admin123!',
    nombre: 'Administrador Demo',
    role: UserRole.ADMINISTRADOR,
    tenantScoped: true,
    establishmentCode: '0000',
    profile: {
      numeroDocumento: '10000001',
      nombres: 'Admin',
      apellidos: 'Demo',
      cargo: 'Administrador',
    },
  },
  {
    email: `admin.cadena@${DOMAIN}`,
    passwordPlain: 'Cadena123!',
    nombre: 'Admin Cadena Demo',
    role: UserRole.ADMIN_CADENA,
    tenantScoped: true,
    establishmentCode: '0000',
    profile: {
      numeroDocumento: '10000002',
      nombres: 'Admin',
      apellidos: 'Cadena',
      cargo: 'Admin cadena',
    },
  },
  {
    email: `gerente@${DOMAIN}`,
    passwordPlain: 'Gerente123!',
    nombre: 'Gerente Sucursal Demo',
    role: UserRole.GERENTE_SUCURSAL,
    tenantScoped: true,
    establishmentCode: '0001',
    profile: {
      numeroDocumento: '10000003',
      nombres: 'Gerente',
      apellidos: 'Sucursal',
      cargo: 'Gerente de sucursal',
    },
  },
  {
    email: `farmaceutico.titular@${DOMAIN}`,
    passwordPlain: 'Titular123!',
    nombre: 'Farmacéutico Titular Demo',
    role: UserRole.FARMACEUTICO_TITULAR,
    tenantScoped: true,
    establishmentCode: '0000',
    profile: {
      numeroDocumento: '10000004',
      nombres: 'Farmacéutico',
      apellidos: 'Titular',
      cargo: 'Farmacéutico titular',
    },
  },
  {
    email: `farmaceutico@${DOMAIN}`,
    passwordPlain: 'Farma123!',
    nombre: 'Farmacéutico Demo',
    role: UserRole.FARMACEUTICO,
    tenantScoped: true,
    establishmentCode: '0000',
    profile: {
      numeroDocumento: '10000005',
      nombres: 'Farmacéutico',
      apellidos: 'Demo',
      cargo: 'Farmacéutico',
    },
  },
  {
    email: `tecnico@${DOMAIN}`,
    passwordPlain: 'Tecnico123!',
    nombre: 'Técnico Farmacéutico Demo',
    role: UserRole.TECNICO_FARMACEUTICO,
    tenantScoped: true,
    establishmentCode: '0001',
    profile: {
      numeroDocumento: '10000006',
      nombres: 'Técnico',
      apellidos: 'Farmacéutico',
      cargo: 'Técnico farmacéutico',
    },
  },
  {
    email: `cajero@${DOMAIN}`,
    passwordPlain: 'Cajero123!',
    nombre: 'Cajero Demo',
    role: UserRole.CAJERO,
    tenantScoped: true,
    establishmentCode: '0001',
    profile: {
      numeroDocumento: '10000007',
      nombres: 'Cajero',
      apellidos: 'Demo',
      cargo: 'Cajero',
    },
  },
  {
    email: `vendedor@${DOMAIN}`,
    passwordPlain: 'Vendedor123!',
    nombre: 'Vendedor Demo',
    role: UserRole.VENDEDOR,
    tenantScoped: true,
    establishmentCode: '0001',
    profile: {
      numeroDocumento: '10000008',
      nombres: 'Vendedor',
      apellidos: 'Demo',
      cargo: 'Vendedor',
    },
  },
  {
    email: `almacenero@${DOMAIN}`,
    passwordPlain: 'Almacen123!',
    nombre: 'Almacenero Demo',
    role: UserRole.ALMACENERO,
    tenantScoped: true,
    establishmentCode: '0000',
    profile: {
      numeroDocumento: '10000009',
      nombres: 'Almacenero',
      apellidos: 'Demo',
      cargo: 'Almacenero',
    },
  },
  {
    email: `contador@${DOMAIN}`,
    passwordPlain: 'Contador123!',
    nombre: 'Contador Demo',
    role: UserRole.CONTADOR,
    tenantScoped: true,
    establishmentCode: '0000',
    profile: {
      numeroDocumento: '10000010',
      nombres: 'Contador',
      apellidos: 'Demo',
      cargo: 'Contador',
    },
  },
] as const;

/** Atajos usados por tests / docs. */
export const adminDemoCredentials = {
  email: `admin@${DOMAIN}`,
  passwordPlain: 'Admin123!',
} as const;

export const superAdminDemoCredentials = {
  email: `superadmin@${DOMAIN}`,
  passwordPlain: 'SuperAdmin123!',
} as const;

export const demoCajeroCredentials = {
  email: `cajero@${DOMAIN}`,
  passwordPlain: 'Cajero123!',
} as const;
