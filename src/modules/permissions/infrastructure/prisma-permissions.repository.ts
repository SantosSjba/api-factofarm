import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { IPermissionsRepository, PermissionMenuNode } from '../domain/permissions.repository';

@Injectable()
export class PrismaPermissionsRepository implements IPermissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMenuTreeRoot(rootCode: string): Promise<PermissionMenuNode | null> {
    const row = await this.prisma.permission.findFirst({
      where: { code: rootCode },
      include: {
        children: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!row) return null;
    return {
      id: row.id,
      code: row.code,
      label: row.label,
      children: row.children.map((c) => ({
        id: c.id,
        code: c.code,
        label: c.label,
      })),
    };
  }
}
