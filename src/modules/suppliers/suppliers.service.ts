import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { buildPaginatedResult } from '../../common/dto/pagination.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { EntityIntegrityService } from '../../common/services/entity-integrity.service';
import { assertTenantAccess, actorFromJwt, requireTenantId, tenantWhere } from '../../common/scoping/tenant-scope.util';
import type { JwtRequestUser } from '../auth/domain/auth.types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { SupplierListQueryDto } from './dto/supplier-list-query.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { UpsertSupplierProductDto } from './dto/upsert-supplier-product.dto';

const selectSupplier = {
  id: true,
  razonSocial: true,
  nombreComercial: true,
  tipoDocumento: true,
  numeroDocumento: true,
  departmentId: true,
  provinceId: true,
  districtId: true,
  direccion: true,
  telefono: true,
  correoElectronico: true,
  contactoNombre: true,
  contactoTelefono: true,
  diasCredito: true,
  condicionesPago: true,
  observaciones: true,
  habilitado: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SupplierSelect;

const selectSupplierProduct = {
  id: true,
  supplierId: true,
  productId: true,
  codigoProveedor: true,
  precioCompra: true,
  plazoDias: true,
  createdAt: true,
  updatedAt: true,
  product: {
    select: {
      id: true,
      nombre: true,
      codigoInterno: true,
    },
  },
} satisfies Prisma.SupplierProductSelect;

@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly integrity: EntityIntegrityService,
  ) {}

  async list(query: SupplierListQueryDto, actor?: JwtRequestUser) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const search = query.search?.trim();
    const field = query.field ?? 'all';

    const searchable: Prisma.SupplierWhereInput[] = [];
    if (search) {
      if (field === 'all' || field === 'razonSocial') {
        searchable.push({ razonSocial: { contains: search, mode: 'insensitive' } });
      }
      if (field === 'all' || field === 'numeroDocumento') {
        searchable.push({ numeroDocumento: { contains: search, mode: 'insensitive' } });
      }
    }

    const where: Prisma.SupplierWhereInput = {
      deletedAt: null,
      ...(actor ? tenantWhere(actorFromJwt(actor)) : {}),
      ...(searchable.length ? { OR: searchable } : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.supplier.count({ where }),
      this.prisma.supplier.findMany({
        where,
        orderBy: { razonSocial: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: selectSupplier,
      }),
    ]);

    return buildPaginatedResult(items, total, page, pageSize);
  }

  async findAllOptions(actor?: JwtRequestUser) {
    return this.prisma.supplier.findMany({
      where: { deletedAt: null, habilitado: true, ...(actor ? tenantWhere(actorFromJwt(actor)) : {}) },
      orderBy: { razonSocial: 'asc' },
      select: { id: true, razonSocial: true, numeroDocumento: true },
    });
  }

  async findOne(id: string, actor?: JwtRequestUser) {
    const row = await this.prisma.supplier.findFirst({
      where: { id, deletedAt: null },
      select: { ...selectSupplier, tenantId: true },
    });
    if (!row) throw new NotFoundException('Proveedor no encontrado');
    if (actor) {
      assertTenantAccess(actorFromJwt(actor), row.tenantId);
    }
    const { tenantId: _tenantId, ...supplier } = row;
    return supplier;
  }

  async create(dto: CreateSupplierDto, actor: JwtRequestUser) {
    const tenantId = requireTenantId(actorFromJwt(actor));
    try {
      const created = await this.prisma.supplier.create({
        data: this.toCreateInput(dto, tenantId),
        select: selectSupplier,
      });
      await this.audit.log({
        userId: actor?.sub,
        action: 'CREATE',
        entity: 'Supplier',
        entityId: created.id,
      });
      return created;
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async update(id: string, dto: UpdateSupplierDto, actor?: JwtRequestUser) {
    await this.ensureSupplier(id, actor);
    try {
      const updated = await this.prisma.supplier.update({
        where: { id },
        data: this.toUpdateInput(dto),
        select: selectSupplier,
      });
      await this.audit.log({
        userId: actor?.sub,
        action: 'UPDATE',
        entity: 'Supplier',
        entityId: id,
        diff: dto,
      });
      return updated;
    } catch (err) {
      this.handleKnownError(err);
    }
  }

  async remove(id: string, actor?: JwtRequestUser) {
    await this.ensureSupplier(id, actor);
    await this.integrity.assertCanDeleteSupplier(id);
    await this.prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date(), habilitado: false },
    });
    await this.audit.log({
      userId: actor?.sub,
      action: 'DELETE',
      entity: 'Supplier',
      entityId: id,
    });
  }

  async listProducts(supplierId: string, actor?: JwtRequestUser) {
    await this.ensureSupplier(supplierId, actor);
    const rows = await this.prisma.supplierProduct.findMany({
      where: { supplierId },
      orderBy: { createdAt: 'desc' },
      select: selectSupplierProduct,
    });
    return rows.map((row) => ({
      ...row,
      precioCompra: row.precioCompra?.toString() ?? null,
    }));
  }

  async upsertProduct(
    supplierId: string,
    dto: UpsertSupplierProductDto,
    actor?: JwtRequestUser,
  ) {
    const supplier = await this.ensureSupplier(supplierId, actor);
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, deletedAt: null },
      select: { id: true, tenantId: true },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    if (actor) {
      assertTenantAccess(actorFromJwt(actor), product.tenantId);
    }
    if (supplier.tenantId !== product.tenantId) {
      throw new NotFoundException('Producto no encontrado');
    }

    const data = {
      codigoProveedor: dto.codigoProveedor?.trim() || null,
      precioCompra:
        dto.precioCompra != null ? new Prisma.Decimal(dto.precioCompra) : null,
      plazoDias: dto.plazoDias ?? 0,
    };

    const row = await this.prisma.supplierProduct.upsert({
      where: {
        supplierId_productId: { supplierId, productId: dto.productId },
      },
      create: { supplierId, productId: dto.productId, ...data },
      update: data,
      select: selectSupplierProduct,
    });

    await this.audit.log({
      userId: actor?.sub,
      action: 'UPSERT',
      entity: 'SupplierProduct',
      entityId: row.id,
      diff: dto,
    });

    return { ...row, precioCompra: row.precioCompra?.toString() ?? null };
  }

  async removeProduct(supplierId: string, productId: string, actor?: JwtRequestUser) {
    await this.ensureSupplier(supplierId, actor);
    const link = await this.prisma.supplierProduct.findUnique({
      where: { supplierId_productId: { supplierId, productId } },
      select: { id: true },
    });
    if (!link) throw new NotFoundException('Producto no vinculado al proveedor');

    await this.prisma.supplierProduct.delete({
      where: { supplierId_productId: { supplierId, productId } },
    });
    await this.audit.log({
      userId: actor?.sub,
      action: 'DELETE',
      entity: 'SupplierProduct',
      entityId: link.id,
    });
  }

  private async ensureSupplier(id: string, actor?: JwtRequestUser) {
    const row = await this.prisma.supplier.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, tenantId: true },
    });
    if (!row) throw new NotFoundException('Proveedor no encontrado');
    if (actor) {
      assertTenantAccess(actorFromJwt(actor), row.tenantId);
    }
    return row;
  }

  private toCreateInput(dto: CreateSupplierDto, tenantId: string): Prisma.SupplierCreateInput {
    return {
      tenant: { connect: { id: tenantId } },
      razonSocial: dto.razonSocial.trim().toUpperCase(),
      nombreComercial: dto.nombreComercial?.trim() || null,
      tipoDocumento: dto.tipoDocumento,
      numeroDocumento: dto.numeroDocumento.trim(),
      department: dto.departmentId
        ? { connect: { id: dto.departmentId } }
        : undefined,
      province: dto.provinceId ? { connect: { id: dto.provinceId } } : undefined,
      district: dto.districtId ? { connect: { id: dto.districtId } } : undefined,
      direccion: dto.direccion?.trim() || null,
      telefono: dto.telefono?.trim() || null,
      correoElectronico: dto.correoElectronico?.trim().toLowerCase() || null,
      contactoNombre: dto.contactoNombre?.trim() || null,
      contactoTelefono: dto.contactoTelefono?.trim() || null,
      diasCredito: dto.diasCredito ?? 0,
      condicionesPago: dto.condicionesPago?.trim() || null,
      observaciones: dto.observaciones?.trim() || null,
      habilitado: dto.habilitado ?? true,
    };
  }

  private toUpdateInput(dto: UpdateSupplierDto): Prisma.SupplierUpdateInput {
    const data: Prisma.SupplierUpdateInput = {};
    if (dto.razonSocial !== undefined) {
      data.razonSocial = dto.razonSocial.trim().toUpperCase();
    }
    if (dto.nombreComercial !== undefined) {
      data.nombreComercial = dto.nombreComercial?.trim() || null;
    }
    if (dto.tipoDocumento !== undefined) data.tipoDocumento = dto.tipoDocumento;
    if (dto.numeroDocumento !== undefined) {
      data.numeroDocumento = dto.numeroDocumento.trim();
    }
    if (dto.departmentId !== undefined) {
      data.department = dto.departmentId
        ? { connect: { id: dto.departmentId } }
        : { disconnect: true };
    }
    if (dto.provinceId !== undefined) {
      data.province = dto.provinceId
        ? { connect: { id: dto.provinceId } }
        : { disconnect: true };
    }
    if (dto.districtId !== undefined) {
      data.district = dto.districtId
        ? { connect: { id: dto.districtId } }
        : { disconnect: true };
    }
    if (dto.direccion !== undefined) data.direccion = dto.direccion?.trim() || null;
    if (dto.telefono !== undefined) data.telefono = dto.telefono?.trim() || null;
    if (dto.correoElectronico !== undefined) {
      data.correoElectronico = dto.correoElectronico?.trim().toLowerCase() || null;
    }
    if (dto.contactoNombre !== undefined) {
      data.contactoNombre = dto.contactoNombre?.trim() || null;
    }
    if (dto.contactoTelefono !== undefined) {
      data.contactoTelefono = dto.contactoTelefono?.trim() || null;
    }
    if (dto.diasCredito !== undefined) data.diasCredito = dto.diasCredito;
    if (dto.condicionesPago !== undefined) {
      data.condicionesPago = dto.condicionesPago?.trim() || null;
    }
    if (dto.observaciones !== undefined) {
      data.observaciones = dto.observaciones?.trim() || null;
    }
    if (dto.habilitado !== undefined) data.habilitado = dto.habilitado;
    return data;
  }

  async listPurchaseHistory(supplierId: string, actor?: JwtRequestUser) {
    await this.findOne(supplierId, actor);
    const rows = await this.prisma.purchaseOrder.findMany({
      where: { supplierId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        numero: true,
        estado: true,
        total: true,
        fechaEmision: true,
        warehouse: { select: { nombre: true } },
      },
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        numero: r.numero,
        estado: r.estado,
        total: r.total.toString(),
        fechaEmision: r.fechaEmision.toISOString(),
        warehouse: r.warehouse.nombre,
      })),
      total: rows.length,
      page: 1,
      pageSize: 50,
    };
  }

  private handleKnownError(err: unknown): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictException('Ya existe un proveedor con ese documento.');
    }
    throw err;
  }
}
