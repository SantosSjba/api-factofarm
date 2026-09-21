import { UserRole } from '../../generated/prisma/client';
import { MENU_NAV_LEAF_CODES } from '../../../prisma/seed/steps/permissions';
import {
  expandUserPermissionCodes,
  extractNavPermissionCodes,
  NAV_TO_RBAC_EXPANSION,
} from './nav-permission-expansion';

describe('nav-permission-expansion', () => {
  it('expande nav.productos a RBAC completo', () => {
    const result = expandUserPermissionCodes(['nav.productos'], UserRole.VENDEDOR);
    expect(result).toEqual(
      expect.arrayContaining([
        'nav.productos',
        'products.read',
        'products.write',
        'products.delete',
      ]),
    );
    expect(result).not.toContain('users.read');
    expect(result).not.toContain('users.write');
  });

  it('agrega users.write para administrador', () => {
    const result = expandUserPermissionCodes(['nav.clientes_list'], UserRole.ADMINISTRADOR);
    expect(result).toContain('users.write');
    expect(result).toContain('customers.delete');
  });

  it('expande nav.usuarios a users.read/write', () => {
    const result = expandUserPermissionCodes(['nav.usuarios'], UserRole.GERENTE_SUCURSAL);
    expect(result).toEqual(
      expect.arrayContaining(['nav.usuarios', 'users.read', 'users.write', 'audit.read']),
    );
  });

  it('cada módulo Fase 1 con API tiene expansión RBAC', () => {
    for (const code of Object.keys(NAV_TO_RBAC_EXPANSION)) {
      expect(MENU_NAV_LEAF_CODES).toContain(code);
    }
  });

  it('reexpande sales.write si queda nav.punto_venta aunque se quiten códigos sales.*', () => {
    const result = expandUserPermissionCodes(
      ['nav.punto_venta', 'nav.caja_chica_pos', 'cash.open'],
      UserRole.CAJERO,
    );
    expect(result).toContain('sales.write');
    expect(result).toContain('sales.read');
  });

  it('revoca ventas al quitar nav.punto_venta', () => {
    const result = expandUserPermissionCodes(['nav.caja_chica_pos'], UserRole.CAJERO);
    expect(result).not.toContain('sales.write');
    expect(result).toContain('cash.open');
  });

  it('extractNavPermissionCodes filtra solo nav.*', () => {
    const nav = extractNavPermissionCodes([
      'nav.marcas',
      'brands.read',
      'brands.write',
      'users.read',
    ]);
    expect(nav).toEqual(['nav.marcas']);
  });
});
