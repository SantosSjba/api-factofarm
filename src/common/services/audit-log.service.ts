import { Injectable } from '@nestjs/common';
import { RequestContextService } from './request-context.service';
import { PrismaService } from '../../prisma/prisma.service';

export type AuditLogInput = {
  userId?: string;
  tenantId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  diff?: unknown;
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class AuditLogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService,
  ) {}

  async log(input: AuditLogInput): Promise<void> {
    const ctx = this.requestContext.get();
    let tenantId = input.tenantId ?? null;
    if (tenantId == null && input.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: input.userId },
        select: { tenantId: true },
      });
      tenantId = user?.tenantId ?? null;
    }
    await this.prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        tenantId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        diff: input.diff != null ? (input.diff as object) : undefined,
        ipAddress: input.ipAddress ?? ctx.ipAddress ?? null,
        userAgent: input.userAgent ?? ctx.userAgent ?? null,
      },
    });
  }
}
