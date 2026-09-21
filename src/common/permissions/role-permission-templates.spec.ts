import { UserRole } from '../../generated/prisma/client';
import { getDefaultNavCodesForRole } from './role-permission-templates';

describe('getDefaultNavCodesForRole', () => {
  it('gerente de sucursal incluye POS y caja', () => {
    const nav = getDefaultNavCodesForRole(UserRole.GERENTE_SUCURSAL);
    expect(nav).toEqual(
      expect.arrayContaining(['nav.punto_venta', 'nav.caja_chica_pos', 'nav.productos']),
    );
  });

  it('administrador aprovisionado tiene POS, productos y unidades', () => {
    const nav = getDefaultNavCodesForRole(UserRole.ADMINISTRADOR);
    expect(nav).toEqual(
      expect.arrayContaining([
        'nav.punto_venta',
        'nav.caja_chica_pos',
        'nav.productos',
        'nav.unidades',
        'nav.establecimientos',
      ]),
    );
    expect(nav).not.toContain('nav.platform_clientes');
  });
});
