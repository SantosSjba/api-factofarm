import { NotFoundException } from '@nestjs/common';
import { PharmacistLicenseService } from './pharmacist-license.service';

describe('PharmacistLicenseService', () => {
  const prisma = {
    pharmacistLicense: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };
  const audit = { log: jest.fn() };
  const crypto = { encrypt: jest.fn(), decrypt: jest.fn() };
  const service = new PharmacistLicenseService(prisma as never, audit as never, crypto as never);

  beforeEach(() => jest.clearAllMocks());

  it('lista colegiaturas activas', async () => {
    prisma.pharmacistLicense.findMany.mockResolvedValue([{ id: 'pl-1' }]);
    const rows = await service.list();
    expect(rows).toHaveLength(1);
  });

  it('crea licencia farmacéutica', async () => {
    prisma.pharmacistLicense.create.mockResolvedValue({ id: 'pl-1', fullName: 'Dr. Test' });
    const row = await service.create({
      colegiaturaCqp: 'CQP-123',
      fullName: 'Dr. Test',
    });
    expect(row.id).toBe('pl-1');
    expect(audit.log).toHaveBeenCalled();
  });

  it('lanza not found al actualizar inexistente', async () => {
    prisma.pharmacistLicense.findFirst.mockResolvedValue(null);
    await expect(service.update('missing', { fullName: 'X' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
