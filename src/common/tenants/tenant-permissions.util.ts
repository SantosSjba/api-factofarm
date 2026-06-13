import {
  expandUserPermissionCodes,
  NAV_TO_RBAC_EXPANSION,
} from '../permissions/nav-permission-expansion';
import { resolveTenantEnabledModules } from '../tenants/tenant-plan.util';
import type { TenantPlan } from '../../generated/prisma/client';
import type { UserRole } from '../../generated/prisma/client';

/**
 * Aplica límites de módulos contratados por el tenant sobre los permisos del usuario.
 */
export function resolveUserPermissionCodes(input: {
  role: UserRole;
  permissionCodes: string[];
  tenant?: { plan: TenantPlan; enabledModules: unknown } | null;
}): string[] {
  const expanded = expandUserPermissionCodes(input.permissionCodes, input.role);
  if (!input.tenant) {
    return expanded;
  }

  const allowedNav = new Set(
    resolveTenantEnabledModules({
      plan: input.tenant.plan,
      enabledModules: input.tenant.enabledModules,
    }),
  );

  const filtered = expanded.filter((code) => {
    if (!code.startsWith('nav.')) {
      return true;
    }
    return allowedNav.has(code);
  });

  const result = new Set(filtered.filter((code) => !code.startsWith('nav.')));
  for (const navCode of allowedNav) {
    if (filtered.includes(navCode)) {
      result.add(navCode);
      const implied = NAV_TO_RBAC_EXPANSION[navCode];
      if (implied) {
        for (const rbac of implied) {
          result.add(rbac);
        }
      }
    }
  }

  result.add('users.read');
  return [...result].sort();
}
