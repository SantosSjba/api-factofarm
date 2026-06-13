import { Inject, Injectable } from '@nestjs/common';
import { CacheService } from '../../../common/cache/cache.service';
import { listRoleTemplates } from '../../../common/permissions/role-permission-templates';
import { PERMISSIONS_REPOSITORY } from '../domain/permissions.repository';
import type { IPermissionsRepository } from '../domain/permissions.repository';

const MENU_ROOT_CODES = [
  'nav.dashboard',
  'nav.usuarios_series',
  'nav.clientes',
  'nav.productos_catalogo',
  'nav.compras',
  'nav.pos',
  'nav.ventas',
  'nav.inventario',
  'nav.comprobantes_avanzados',
  'nav.guias_remision',
  'nav.reportes',
  'nav.contabilidad',
  'nav.finanzas',
  'nav.farmacos',
] as const;

@Injectable()
export class PermissionsService {
  constructor(
    @Inject(PERMISSIONS_REPOSITORY) private readonly permissions: IPermissionsRepository,
    private readonly cache: CacheService,
  ) {}

  menuTree() {
    return this.cache.getOrSet('permissions:menu:usuarios_series', () =>
      this.permissions.findMenuTreeRoot('nav.usuarios_series'),
    );
  }

  menuTrees() {
    return this.cache.getOrSet('permissions:menu:roots', () =>
      this.permissions.findMenuTreeRoots([...MENU_ROOT_CODES]),
    );
  }

  roleTemplates() {
    return listRoleTemplates();
  }
}
