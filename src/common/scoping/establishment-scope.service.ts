import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { JwtRequestUser } from '../../modules/auth/domain/auth.types';
import { hasChainScope, isPlatformAdmin } from '../permissions/role-policy.util';
import { PrismaService } from '../../prisma/prisma.service';
import { actorFromJwt, assertTenantAccess } from './tenant-scope.util';
import {
  establishmentWhere,
  resolveEstablishmentScope,
  type ScopeActor,
} from './establishment-scope.util';

@Injectable()
export class EstablishmentScopeService {
  constructor(private readonly prisma: PrismaService) {}

  toActor(user: JwtRequestUser): ScopeActor {
    return {
      establecimientoId: user.establecimientoId,
      role: user.role,
      tenantId: user.tenantId ?? null,
    };
  }

  /** Resuelve sucursal efectiva y valida tenant (usar en lugar de resolve sync). */
  async resolve(user: JwtRequestUser, requestedEstablishmentId?: string | null): Promise<string> {
    return this.resolveScoped(user, requestedEstablishmentId);
  }

  async resolveScoped(
    user: JwtRequestUser,
    requestedEstablishmentId?: string | null,
  ): Promise<string> {
    const establishmentId = resolveEstablishmentScope(this.toActor(user), requestedEstablishmentId);
    await this.assertEstablishmentInTenant(user, establishmentId);
    return establishmentId;
  }

  where(user: JwtRequestUser, field = 'establishmentId') {
    return establishmentWhere(this.toActor(user), field);
  }

  /**
   * Valida acceso a un establecimiento: primero tenant, luego sucursal
   * (admins de cadena / plataforma pueden cruzar sucursales del mismo tenant).
   */
  async assertAccess(user: JwtRequestUser, resourceEstablishmentId: string): Promise<void> {
    await this.assertEstablishmentInTenant(user, resourceEstablishmentId);
    if (isPlatformAdmin(user.role) || hasChainScope(user.role)) {
      return;
    }
    if (resourceEstablishmentId !== user.establecimientoId) {
      throw new ForbiddenException('No puede acceder a datos de otra sucursal');
    }
  }

  async assertEstablishmentInTenant(
    user: JwtRequestUser,
    establishmentId: string,
  ): Promise<void> {
    if (isPlatformAdmin(user.role)) {
      return;
    }
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario sin tenant asignado');
    }
    const row = await this.prisma.establishment.findFirst({
      where: { id: establishmentId, deletedAt: null },
      select: { tenantId: true },
    });
    if (!row) {
      throw new NotFoundException('Establecimiento no encontrado');
    }
    if (row.tenantId !== user.tenantId) {
      throw new ForbiddenException('No puede acceder a datos de otro cliente');
    }
  }

  async assertWarehouseInTenant(user: JwtRequestUser, warehouseId: string): Promise<void> {
    const row = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, deletedAt: null },
      select: { establishmentId: true },
    });
    if (!row) {
      throw new NotFoundException('Almacén no encontrado');
    }
    await this.assertEstablishmentInTenant(user, row.establishmentId);
  }

  async assertWarehouseZoneInTenant(user: JwtRequestUser, warehouseZoneId: string): Promise<void> {
    const row = await this.prisma.warehouseZone.findFirst({
      where: { id: warehouseZoneId, deletedAt: null },
      select: { warehouse: { select: { establishmentId: true } } },
    });
    if (!row) {
      throw new NotFoundException('Zona de almacén no encontrada');
    }
    await this.assertEstablishmentInTenant(user, row.warehouse.establishmentId);
  }

  /** IDs de sucursales activas del tenant (null = sin filtro para plataforma). */
  async establishmentIdsForActor(user: JwtRequestUser): Promise<string[] | null> {
    if (isPlatformAdmin(user.role)) {
      return null;
    }
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario sin tenant asignado');
    }
    const rows = await this.prisma.establishment.findMany({
      where: { tenantId: user.tenantId, deletedAt: null, activo: true },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  async assertCustomerInTenant(user: JwtRequestUser, customerId: string): Promise<void> {
    const row = await this.prisma.customer.findFirst({
      where: { id: customerId, deletedAt: null },
      select: { tenantId: true },
    });
    if (!row) {
      throw new NotFoundException('Cliente no encontrado');
    }
    assertTenantAccess(actorFromJwt(user), row.tenantId);
  }

  async assertProductInTenant(user: JwtRequestUser, productId: string): Promise<void> {
    const row = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
      select: { tenantId: true },
    });
    if (!row) {
      throw new NotFoundException('Producto no encontrado');
    }
    assertTenantAccess(actorFromJwt(user), row.tenantId);
  }

  async assertSupplierInTenant(user: JwtRequestUser, supplierId: string): Promise<void> {
    const row = await this.prisma.supplier.findFirst({
      where: { id: supplierId, deletedAt: null },
      select: { tenantId: true },
    });
    if (!row) {
      throw new NotFoundException('Proveedor no encontrado');
    }
    assertTenantAccess(actorFromJwt(user), row.tenantId);
  }
}
