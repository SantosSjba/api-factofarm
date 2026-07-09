import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogService } from './audit-log.service';
import { RequestContextService } from './request-context.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let context: RequestContextService;
  const create = jest.fn().mockResolvedValue({});

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        RequestContextService,
        {
          provide: PrismaService,
          useValue: {
            auditLog: { create },
            user: { findUnique: jest.fn().mockResolvedValue({ tenantId: 'tenant-1' }) },
          },
        },
      ],
    }).compile();

    service = module.get(AuditLogService);
    context = module.get(RequestContextService);
    create.mockClear();
  });

  it('persists audit row with request context IP/UA', async () => {
    await context.run({ ipAddress: '10.0.0.1', userAgent: 'jest' }, async () => {
      await service.log({
        userId: 'user-1',
        action: 'CREATE',
        entity: 'Sale',
        entityId: 'sale-1',
      });
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ipAddress: '10.0.0.1',
          userAgent: 'jest',
          action: 'CREATE',
        }),
      }),
    );
  });
});
