import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type DashboardStats = {
  usersActive: number;
  establishmentsActive: number;
  customersActive: number;
  productsActive: number;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<DashboardStats> {
    const [usersActive, establishmentsActive, customersActive, productsActive] =
      await Promise.all([
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.establishment.count({ where: { deletedAt: null, activo: true } }),
        this.prisma.customer.count({ where: { deletedAt: null, activo: true } }),
        this.prisma.product.count({ where: { deletedAt: null, habilitado: true } }),
      ]);

    return { usersActive, establishmentsActive, customersActive, productsActive };
  }
}
