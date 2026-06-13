import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type DashboardInventoryAlerts = {
  stockBajo: number;
  lotesVencidos: number;
  porVencer30: number;
  porVencer60: number;
  porVencer90: number;
  zonasFrioSinLogHoy: number;
};

export type DashboardStats = {
  usersActive: number;
  establishmentsActive: number;
  customersActive: number;
  productsActive: number;
  inventoryAlerts: DashboardInventoryAlerts;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<DashboardStats> {
    const now = new Date();
    const in30 = new Date(now);
    in30.setDate(in30.getDate() + 30);
    const in60 = new Date(now);
    in60.setDate(in60.getDate() + 60);
    const in90 = new Date(now);
    in90.setDate(in90.getDate() + 90);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      usersActive,
      establishmentsActive,
      customersActive,
      productsActive,
      stockRows,
      lotesVencidos,
      porVencer30,
      porVencer60,
      porVencer90,
      zonasFrioSinLogHoy,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.establishment.count({ where: { deletedAt: null, activo: true } }),
      this.prisma.customer.count({ where: { deletedAt: null, activo: true } }),
      this.prisma.product.count({ where: { deletedAt: null, habilitado: true } }),
      this.prisma.productWarehouseStock.findMany({
        where: {
          product: { deletedAt: null, habilitado: true },
          warehouse: { deletedAt: null },
        },
        select: { cantidad: true, product: { select: { stockMinimo: true } } },
      }),
      this.prisma.productLotStock.count({
        where: { deletedAt: null, stock: { gt: 0 }, fechaVencimiento: { lt: now } },
      }),
      this.prisma.productLotStock.count({
        where: {
          deletedAt: null,
          stock: { gt: 0 },
          fechaVencimiento: { gte: now, lte: in30 },
        },
      }),
      this.prisma.productLotStock.count({
        where: {
          deletedAt: null,
          stock: { gt: 0 },
          fechaVencimiento: { gt: in30, lte: in60 },
        },
      }),
      this.prisma.productLotStock.count({
        where: {
          deletedAt: null,
          stock: { gt: 0 },
          fechaVencimiento: { gt: in60, lte: in90 },
        },
      }),
      this.prisma.warehouseZone.count({
        where: {
          deletedAt: null,
          activo: true,
          tipo: 'REFRIGERADO',
          temperatureLogs: { none: { fecha: { gte: startOfDay } } },
        },
      }),
    ]);

    const stockBajo = stockRows.filter((row) =>
      row.cantidad.lessThan(row.product.stockMinimo),
    ).length;

    return {
      usersActive,
      establishmentsActive,
      customersActive,
      productsActive,
      inventoryAlerts: {
        stockBajo,
        lotesVencidos,
        porVencer30,
        porVencer60,
        porVencer90,
        zonasFrioSinLogHoy,
      },
    };
  }

  /** Vista consolidada multi-sucursal para administradores de cadena. */
  async getChainSummary() {
    const establishments = await this.prisma.establishment.findMany({
      where: { deletedAt: null, activo: true },
      select: { id: true, nombre: true, codigo: true },
      orderBy: { nombre: 'asc' },
    });

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const rows = await Promise.all(
      establishments.map(async (est) => {
        const [salesCount, salesTotal, stockValue] = await Promise.all([
          this.prisma.sale.count({
            where: {
              establishmentId: est.id,
              deletedAt: null,
              estado: 'COMPLETADA',
              createdAt: { gte: since },
            },
          }),
          this.prisma.sale.aggregate({
            where: {
              establishmentId: est.id,
              deletedAt: null,
              estado: 'COMPLETADA',
              createdAt: { gte: since },
            },
            _sum: { total: true },
          }),
          this.prisma.productWarehouseStock.aggregate({
            where: { warehouse: { establishmentId: est.id, deletedAt: null } },
            _sum: { cantidad: true },
          }),
        ]);
        return {
          establishmentId: est.id,
          nombre: est.nombre,
          codigo: est.codigo,
          ventas30d: salesCount,
          totalVentas30d: salesTotal._sum.total?.toString() ?? '0',
          unidadesStock: stockValue._sum.cantidad?.toString() ?? '0',
        };
      }),
    );

    return { periodDays: 30, establishments: rows };
  }

  async getManagerDashboard(establishmentId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const [salesToday, salesWeek, pendingVoids, openSessions, staffPresent] = await Promise.all([
      this.prisma.sale.aggregate({
        where: {
          establishmentId,
          deletedAt: null,
          estado: 'COMPLETADA',
          createdAt: { gte: startOfDay },
        },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.sale.aggregate({
        where: {
          establishmentId,
          deletedAt: null,
          estado: 'COMPLETADA',
          createdAt: { gte: startOfWeek },
        },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.saleVoidRequest.count({
        where: { establishmentId, status: 'PENDIENTE' },
      }),
      this.prisma.cashSession.count({
        where: { estado: 'ABIERTA', cashRegister: { establishmentId } },
      }),
      this.prisma.userAttendance.count({
        where: { establishmentId, checkOutAt: null, checkInAt: { gte: startOfDay } },
      }),
    ]);

    return {
      ventasHoy: (salesToday._sum.total ?? new Prisma.Decimal(0)).toString(),
      ventasHoyCount: salesToday._count,
      ventasSemana: (salesWeek._sum.total ?? new Prisma.Decimal(0)).toString(),
      ventasSemanaCount: salesWeek._count,
      anulacionesPendientes: pendingVoids,
      cajasAbiertas: openSessions,
      personalPresente: staffPresent,
    };
  }

  async getPharmacistDashboard(establishmentId: string) {
    const [pendingPrescriptions, pendingVoids, controlledProducts] = await Promise.all([
      this.prisma.prescription.count({
        where: {
          establishmentId,
          deletedAt: null,
          estado: { in: ['ACTIVA', 'PARCIALMENTE_DISPENSADA'] },
        },
      }),
      this.prisma.saleVoidRequest.count({
        where: { establishmentId, status: 'PENDIENTE' },
      }),
      this.prisma.product.count({
        where: { esControlado: true, deletedAt: null, habilitado: true },
      }),
    ]);

    return {
      recetasPendientes: pendingPrescriptions,
      anulacionesPendientes: pendingVoids,
      productosControladosActivos: controlledProducts,
    };
  }

  async getCashierDashboard(establishmentId: string, userId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [mySales, openSession] = await Promise.all([
      this.prisma.sale.aggregate({
        where: {
          establishmentId,
          sellerId: userId,
          deletedAt: null,
          estado: 'COMPLETADA',
          createdAt: { gte: startOfDay },
        },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.cashSession.findFirst({
        where: {
          estado: 'ABIERTA',
          userId,
          cashRegister: { establishmentId },
        },
        select: { id: true, openedAt: true, montoApertura: true },
      }),
    ]);

    return {
      ventasHoy: (mySales._sum.total ?? new Prisma.Decimal(0)).toString(),
      ventasHoyCount: mySales._count,
      cajaAbierta: !!openSession,
      sesionCaja: openSession
        ? {
            id: openSession.id,
            openedAt: openSession.openedAt.toISOString(),
            montoApertura: openSession.montoApertura.toString(),
          }
        : null,
    };
  }
}
