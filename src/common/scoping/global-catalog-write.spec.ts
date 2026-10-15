import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../generated/prisma/client';
import type { JwtRequestUser } from '../../modules/auth/domain/auth.types';
import { ActivePrinciplesController } from '../../modules/active-principles/active-principles.controller';
import { AdministrationRoutesController } from '../../modules/administration-routes/administration-routes.controller';
import { LaboratoriesController } from '../../modules/laboratories/laboratories.controller';
import { MedicosController } from '../../modules/medicos/medicos.controller';
import { PharmaceuticalFormsController } from '../../modules/pharmaceutical-forms/pharmaceutical-forms.controller';
import { UnitsController } from '../../modules/units/units.controller';

type CatalogController = {
  create(dto: unknown, actor: JwtRequestUser): unknown;
  update(id: string, dto: unknown, actor: JwtRequestUser): unknown;
  remove(id: string, actor: JwtRequestUser): unknown;
};

const controllers: Array<[string, new (service: never) => unknown]> = [
  ['laboratorios', LaboratoriesController],
  ['médicos', MedicosController],
  ['principios activos', ActivePrinciplesController],
  ['vías de administración', AdministrationRoutesController],
  ['formas farmacéuticas', PharmaceuticalFormsController],
  ['unidades', UnitsController],
];

function actor(
  role: UserRole,
  extra: Partial<JwtRequestUser> = {},
): JwtRequestUser {
  return {
    sub: 'u1',
    email: 'qa@example.test',
    role,
    tenantId: role === UserRole.SUPER_ADMIN ? null : 'tenant-1',
    establecimientoId: 'est-1',
    permissionCodes: [],
    ...extra,
  };
}

function build(Controller: new (service: never) => unknown) {
  const service = {
    create: jest.fn().mockResolvedValue({ id: 'c1' }),
    update: jest.fn().mockResolvedValue({ id: 'c1' }),
    remove: jest.fn().mockResolvedValue(undefined),
  };
  return {
    service,
    controller: new Controller(service as never) as CatalogController,
  };
}

describe('Catálogos globales (C6): las farmacias crean, el operador edita', () => {
  describe.each(controllers)('%s', (_name, Controller) => {
    it('un administrador de farmacia puede crear', async () => {
      const { controller, service } = build(Controller);
      await controller.create({}, actor(UserRole.ADMINISTRADOR));
      expect(service.create).toHaveBeenCalled();
    });

    it.each([UserRole.ADMINISTRADOR, UserRole.ADMIN_CADENA])(
      '%s no puede editar ni eliminar',
      (role) => {
        const { controller, service } = build(Controller);
        expect(() => controller.update('c1', {}, actor(role))).toThrow(
          ForbiddenException,
        );
        expect(() => controller.remove('c1', actor(role))).toThrow(
          ForbiddenException,
        );
        expect(service.update).not.toHaveBeenCalled();
        expect(service.remove).not.toHaveBeenCalled();
      },
    );

    it('una sesión de soporte no puede editar ni eliminar', () => {
      const { controller } = build(Controller);
      const support = actor(UserRole.ADMINISTRADOR, { supportSession: true });
      expect(() => controller.update('c1', {}, support)).toThrow(
        ForbiddenException,
      );
      expect(() => controller.remove('c1', support)).toThrow(
        ForbiddenException,
      );
    });

    it('SUPER_ADMIN de plataforma puede editar y eliminar', async () => {
      const { controller, service } = build(Controller);
      const operator = actor(UserRole.SUPER_ADMIN);
      await controller.update('c1', {}, operator);
      await controller.remove('c1', operator);
      expect(service.update).toHaveBeenCalled();
      expect(service.remove).toHaveBeenCalled();
    });
  });
});
