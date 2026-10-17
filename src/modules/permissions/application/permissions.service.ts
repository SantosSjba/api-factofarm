import { Inject, Injectable } from '@nestjs/common';
import { CacheService } from '../../../common/cache/cache.service';
import { isNavPermissionCode } from '../../../common/permissions/nav-permission-expansion';
import { listRoleTemplates } from '../../../common/permissions/role-permission-templates';
import {
  hasChainScope,
  isPlatformAdmin,
} from '../../../common/permissions/role-policy.util';
import {
  resolveTenantEnabledModules,
  TENANT_NAV_CODES,
} from '../../../common/tenants/tenant-plan.util';
import { PrismaService } from '../../../prisma/prisma.service';
import type { JwtRequestUser } from '../../auth/domain/auth.types';
import { PERMISSIONS_REPOSITORY } from '../domain/permissions.repository';
import type {
  IPermissionsRepository,
  PermissionMenuNode,
} from '../domain/permissions.repository';

const MENU_ROOT_CODES = [
  'nav.platform',
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
    @Inject(PERMISSIONS_REPOSITORY)
    private readonly permissions: IPermissionsRepository,
    private readonly cache: CacheService,
    private readonly prisma: PrismaService,
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

  /**
   * Árbol que el actor puede asignar: plataforma solo para SUPER_ADMIN, módulos contratados
   * por el tenant y, para gestores sin alcance de cadena, solo los módulos que ellos tienen.
   */
  async menuTreesFor(actor: JwtRequestUser): Promise<PermissionMenuNode[]> {
    const trees = await this.menuTrees();
    const allowed = await this.assignableNavCodes(actor);
    if (!allowed) return trees;
    return trees
      .map((tree) => ({
        ...tree,
        children: tree.children.filter((c) => allowed.has(c.code)),
      }))
      .filter((tree) => tree.children.length > 0);
  }

  private async assignableNavCodes(
    actor: JwtRequestUser,
  ): Promise<Set<string> | null> {
    if (isPlatformAdmin(actor.role)) return null;
    const tenant = actor.tenantId
      ? await this.prisma.tenant.findUnique({
          where: { id: actor.tenantId },
          select: { plan: true, enabledModules: true },
        })
      : null;
    const modules = tenant
      ? resolveTenantEnabledModules(tenant)
      : [...TENANT_NAV_CODES];
    if (hasChainScope(actor.role)) return new Set(modules);
    const own = new Set(actor.permissionCodes.filter(isNavPermissionCode));
    return new Set(modules.filter((code) => own.has(code)));
  }

  roleTemplates() {
    return listRoleTemplates();
  }
}
