import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserLeaveStatus, UserRole } from '../../generated/prisma/client';
import { StaffService } from './staff.service';

function build(leave: { userId: string; estado: UserLeaveStatus }) {
  const prisma = {
    userLeave: {
      findFirst: jest.fn().mockResolvedValue({ id: 'l1', ...leave }),
      update: jest.fn().mockResolvedValue({ id: 'l1', estado: UserLeaveStatus.APROBADO }),
    },
  };
  const audit = { log: jest.fn() };
  return new StaffService(prisma as never, audit as never);
}

describe('StaffService.updateLeaveStatus', () => {
  it('no deja aprobar la propia licencia', async () => {
    const svc = build({ userId: 'u1', estado: UserLeaveStatus.SOLICITADO });
    await expect(
      svc.updateLeaveStatus('l1', 'e1', { estado: UserLeaveStatus.APROBADO }, 'u1', UserRole.GERENTE_SUCURSAL),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('otro usuario sí puede aprobarla', async () => {
    const svc = build({ userId: 'u1', estado: UserLeaveStatus.SOLICITADO });
    await expect(
      svc.updateLeaveStatus('l1', 'e1', { estado: UserLeaveStatus.APROBADO }, 'u2', UserRole.GERENTE_SUCURSAL),
    ).resolves.toEqual({ id: 'l1', estado: UserLeaveStatus.APROBADO });
  });

  it('no permite volver a cambiar una licencia rechazada', async () => {
    const svc = build({ userId: 'u1', estado: UserLeaveStatus.RECHAZADO });
    await expect(
      svc.updateLeaveStatus('l1', 'e1', { estado: UserLeaveStatus.APROBADO }, 'u2', UserRole.ADMINISTRADOR),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
