import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserRole } from '../../../generated/prisma/client';
import { PharmacistLicenseService } from './pharmacist-license.service';

describe('PharmacistLicenseService', () => {
  const prisma = {
    pharmacistLicense: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    user: { findFirst: jest.fn() },
  };
  const audit = { log: jest.fn() };
  const crypto = { encrypt: jest.fn(), decrypt: jest.fn() };
  const integrity = {
    assertCanDeletePharmacistLicense: jest.fn().mockResolvedValue(undefined),
  };
  const service = new PharmacistLicenseService(
    prisma as never,
    audit as never,
    crypto as never,
    integrity as never,
  );
  const actor = { sub: 'u1', role: UserRole.ADMINISTRADOR, tenantId: 't1' } as never;

  beforeEach(() => jest.clearAllMocks());

  it('lista solo las licencias del cliente', async () => {
    prisma.pharmacistLicense.findMany.mockResolvedValue([{ id: 'pl-1' }]);
    const rows = await service.list(actor);
    expect(rows).toHaveLength(1);
    expect(prisma.pharmacistLicense.findMany.mock.calls[0][0].where).toMatchObject({ tenantId: 't1' });
  });

  it('crea la licencia en el cliente del usuario', async () => {
    prisma.pharmacistLicense.create.mockResolvedValue({ id: 'pl-1', fullName: 'Dr. Test' });
    const row = await service.create({ colegiaturaCqp: 'CQP-123', fullName: 'Dr. Test' }, actor);
    expect(row.id).toBe('pl-1');
    expect(prisma.pharmacistLicense.create.mock.calls[0][0].data.tenantId).toBe('t1');
    expect(audit.log).toHaveBeenCalled();
  });

  it('no deja vincular un usuario de otra empresa', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    await expect(
      service.create({ colegiaturaCqp: 'CQP-1', fullName: 'X', userId: 'otro' }, actor),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('una licencia de otro cliente se ve como inexistente', async () => {
    prisma.pharmacistLicense.findFirst.mockResolvedValue(null);
    await expect(service.update('ajena', { fullName: 'X' }, actor)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.pharmacistLicense.findFirst.mock.calls[0][0].where).toMatchObject({ id: 'ajena', tenantId: 't1' });
  });
});
