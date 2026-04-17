import type { SeedPermissionInput } from '../types';

export const permissionsData: SeedPermissionInput[] = [
  {
    code: 'users.read',
    description: 'Listar y ver usuarios',
  },
  {
    code: 'users.write',
    description: 'Crear y editar usuarios',
  },
];
