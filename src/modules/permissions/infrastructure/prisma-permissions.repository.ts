import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { IPermissionsRepository, PermissionMenuNode } from '../domain/permissions.repository';

@Injectable()
export class PrismaPermissionsRepository implements IPermissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMenuTreeRoots(rootCodes: string[]): Promise<PermissionMenuNode[]> {
    const trees: PermissionMenuNode[] = [];
    for (const code of rootCodes) {
      const tree = await this.findMenuTreeRoot(code);
      if (tree) trees.push(tree);
    }
    return trees;
  }

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
