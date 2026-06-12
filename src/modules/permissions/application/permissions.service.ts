import { Inject, Injectable } from '@nestjs/common';
import { PERMISSIONS_REPOSITORY } from '../domain/permissions.repository';
import type { IPermissionsRepository } from '../domain/permissions.repository';

const MENU_ROOT_CODES = [
  'nav.usuarios_series',
  'nav.clientes',
  'nav.productos_catalogo',
  'nav.compras',
] as const;

@Injectable()
export class PermissionsService {
  constructor(
    @Inject(PERMISSIONS_REPOSITORY) private readonly permissions: IPermissionsRepository,
  ) {}

  menuTree() {
    return this.permissions.findMenuTreeRoot('nav.usuarios_series');
  }

  menuTrees() {
    return this.permissions.findMenuTreeRoots([...MENU_ROOT_CODES]);
  }
}
