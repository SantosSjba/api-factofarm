import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { buildPaginatedResult, paginationArgs } from '../../common/dto/pagination.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateDepartureAddressDto,
  CreateShippingCarrierDto,
  CreateShippingDriverDto,
  CreateShippingVehicleDto,
  ShippingListQueryDto,
  UpdateDepartureAddressDto,
  UpdateShippingCarrierDto,
  UpdateShippingDriverDto,
  UpdateShippingVehicleDto,
} from './dto/shipping-guides.dto';

@Injectable()
export class ShippingGuidesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  listCarriers(establishmentId: string, query?: ShippingListQueryDto) {
    return this.listPaginated(
      query,
      (where, skip, take) =>
        this.prisma.shippingCarrier.findMany({
          where: { ...where, establishmentId },
          skip,
          take,
          orderBy: { razonSocial: 'asc' },
        }),
      (where) => this.prisma.shippingCarrier.count({ where: { ...where, establishmentId } }),
      query?.search,
    );
  }

  async createCarrier(establishmentId: string, dto: CreateShippingCarrierDto, userId: string) {
    try {
      const row = await this.prisma.shippingCarrier.create({
        data: {
          establishmentId,
          ruc: dto.ruc.trim(),
          razonSocial: dto.razonSocial.trim(),
          nombreComercial: dto.nombreComercial?.trim() || null,
          telefono: dto.telefono?.trim() || null,
          correo: dto.correo?.trim() || null,
        },
      });
      await this.audit.log({ userId, action: 'CREATE', entity: 'ShippingCarrier', entityId: row.id });
      return row;
    } catch (err) {
      this.handleUnique(err, 'Ya existe un transportista con ese RUC.');
    }
  }

  async updateCarrier(
    establishmentId: string,
    id: string,
    dto: UpdateShippingCarrierDto,
    userId: string,
  ) {
    await this.ensureCarrier(establishmentId, id);
    const row = await this.prisma.shippingCarrier.update({
      where: { id },
      data: {
        ...(dto.razonSocial !== undefined ? { razonSocial: dto.razonSocial.trim() } : {}),
        ...(dto.nombreComercial !== undefined
          ? { nombreComercial: dto.nombreComercial?.trim() || null }
          : {}),
        ...(dto.telefono !== undefined ? { telefono: dto.telefono?.trim() || null } : {}),
        ...(dto.correo !== undefined ? { correo: dto.correo?.trim() || null } : {}),
        ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
      },
    });
    await this.audit.log({ userId, action: 'UPDATE', entity: 'ShippingCarrier', entityId: id, diff: dto });
    return row;
  }

  async removeCarrier(establishmentId: string, id: string, userId: string) {
    await this.ensureCarrier(establishmentId, id);
    await this.prisma.shippingCarrier.update({
      where: { id },
      data: { deletedAt: new Date(), activo: false },
    });
    await this.audit.log({ userId, action: 'DELETE', entity: 'ShippingCarrier', entityId: id });
  }

  listDrivers(establishmentId: string, query?: ShippingListQueryDto) {
    const carrierId = query?.carrierId;
    return this.listPaginated(
      query,
      (where, skip, take) =>
        this.prisma.shippingDriver.findMany({
          where: {
            ...where,
            establishmentId,
            ...(carrierId ? { carrierId } : {}),
          },
          skip,
          take,
          orderBy: { apellidos: 'asc' },
          include: { carrier: { select: { id: true, razonSocial: true } } },
        }),
      (where) =>
        this.prisma.shippingDriver.count({
          where: { ...where, establishmentId, ...(carrierId ? { carrierId } : {}) },
        }),
      query?.search,
      ['nombres', 'apellidos', 'numeroDocumento', 'licencia'],
    );
  }

  async createDriver(establishmentId: string, dto: CreateShippingDriverDto, userId: string) {
    if (dto.carrierId) await this.ensureCarrier(establishmentId, dto.carrierId);
    try {
      const row = await this.prisma.shippingDriver.create({
        data: {
          establishmentId,
          carrierId: dto.carrierId || null,
          tipoDocumento: dto.tipoDocumento ?? 'DNI',
          numeroDocumento: dto.numeroDocumento.trim(),
          nombres: dto.nombres.trim(),
          apellidos: dto.apellidos.trim(),
          licencia: dto.licencia?.trim() || null,
          telefono: dto.telefono?.trim() || null,
        },
        include: { carrier: { select: { id: true, razonSocial: true } } },
      });
      await this.audit.log({ userId, action: 'CREATE', entity: 'ShippingDriver', entityId: row.id });
      return row;
    } catch (err) {
      this.handleUnique(err, 'Ya existe un conductor con ese documento.');
    }
  }

  async updateDriver(
    establishmentId: string,
    id: string,
    dto: UpdateShippingDriverDto,
    userId: string,
  ) {
    await this.ensureDriver(establishmentId, id);
    if (dto.carrierId) await this.ensureCarrier(establishmentId, dto.carrierId);
    const row = await this.prisma.shippingDriver.update({
      where: { id },
      data: {
        ...(dto.carrierId !== undefined ? { carrierId: dto.carrierId || null } : {}),
        ...(dto.nombres !== undefined ? { nombres: dto.nombres.trim() } : {}),
        ...(dto.apellidos !== undefined ? { apellidos: dto.apellidos.trim() } : {}),
        ...(dto.licencia !== undefined ? { licencia: dto.licencia?.trim() || null } : {}),
        ...(dto.telefono !== undefined ? { telefono: dto.telefono?.trim() || null } : {}),
        ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
      },
      include: { carrier: { select: { id: true, razonSocial: true } } },
    });
    await this.audit.log({ userId, action: 'UPDATE', entity: 'ShippingDriver', entityId: id, diff: dto });
    return row;
  }

  async removeDriver(establishmentId: string, id: string, userId: string) {
    await this.ensureDriver(establishmentId, id);
    await this.prisma.shippingDriver.update({
      where: { id },
      data: { deletedAt: new Date(), activo: false },
    });
    await this.audit.log({ userId, action: 'DELETE', entity: 'ShippingDriver', entityId: id });
  }

  listVehicles(establishmentId: string, query?: ShippingListQueryDto) {
    const carrierId = query?.carrierId;
    return this.listPaginated(
      query,
      (where, skip, take) =>
        this.prisma.shippingVehicle.findMany({
          where: {
            ...where,
            establishmentId,
            ...(carrierId ? { carrierId } : {}),
          },
          skip,
          take,
          orderBy: { placa: 'asc' },
          include: { carrier: { select: { id: true, razonSocial: true } } },
        }),
      (where) =>
        this.prisma.shippingVehicle.count({
          where: { ...where, establishmentId, ...(carrierId ? { carrierId } : {}) },
        }),
      query?.search,
      ['placa', 'marca', 'modelo'],
    );
  }

  async createVehicle(establishmentId: string, dto: CreateShippingVehicleDto, userId: string) {
    if (dto.carrierId) await this.ensureCarrier(establishmentId, dto.carrierId);
    try {
      const row = await this.prisma.shippingVehicle.create({
        data: {
          establishmentId,
          carrierId: dto.carrierId || null,
          placa: dto.placa.trim().toUpperCase(),
          marca: dto.marca?.trim() || null,
          modelo: dto.modelo?.trim() || null,
          capacidadKg:
            dto.capacidadKg != null ? new Prisma.Decimal(dto.capacidadKg) : null,
        },
        include: { carrier: { select: { id: true, razonSocial: true } } },
      });
      await this.audit.log({ userId, action: 'CREATE', entity: 'ShippingVehicle', entityId: row.id });
      return row;
    } catch (err) {
      this.handleUnique(err, 'Ya existe un vehículo con esa placa.');
    }
  }

  async updateVehicle(
    establishmentId: string,
    id: string,
    dto: UpdateShippingVehicleDto,
    userId: string,
  ) {
    await this.ensureVehicle(establishmentId, id);
    if (dto.carrierId) await this.ensureCarrier(establishmentId, dto.carrierId);
    const row = await this.prisma.shippingVehicle.update({
      where: { id },
      data: {
        ...(dto.carrierId !== undefined ? { carrierId: dto.carrierId || null } : {}),
        ...(dto.marca !== undefined ? { marca: dto.marca?.trim() || null } : {}),
        ...(dto.modelo !== undefined ? { modelo: dto.modelo?.trim() || null } : {}),
        ...(dto.capacidadKg !== undefined
          ? { capacidadKg: dto.capacidadKg != null ? new Prisma.Decimal(dto.capacidadKg) : null }
          : {}),
        ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
      },
      include: { carrier: { select: { id: true, razonSocial: true } } },
    });
    await this.audit.log({ userId, action: 'UPDATE', entity: 'ShippingVehicle', entityId: id, diff: dto });
    return row;
  }

  async removeVehicle(establishmentId: string, id: string, userId: string) {
    await this.ensureVehicle(establishmentId, id);
    await this.prisma.shippingVehicle.update({
      where: { id },
      data: { deletedAt: new Date(), activo: false },
    });
    await this.audit.log({ userId, action: 'DELETE', entity: 'ShippingVehicle', entityId: id });
  }

  listDepartureAddresses(establishmentId: string, query?: ShippingListQueryDto) {
    return this.listPaginated(
      query,
      (where, skip, take) =>
        this.prisma.departureAddress.findMany({
          where: { ...where, establishmentId },
          skip,
          take,
          orderBy: { nombre: 'asc' },
          include: {
            department: { select: { id: true, name: true } },
            province: { select: { id: true, name: true } },
            district: { select: { id: true, name: true } },
          },
        }),
      (where) => this.prisma.departureAddress.count({ where: { ...where, establishmentId } }),
      query?.search,
      ['codigo', 'nombre', 'direccion'],
    );
  }

  async createDepartureAddress(
    establishmentId: string,
    dto: CreateDepartureAddressDto,
    userId: string,
  ) {
    try {
      const row = await this.prisma.departureAddress.create({
        data: {
          establishmentId,
          codigo: dto.codigo.trim().toUpperCase(),
          nombre: dto.nombre.trim(),
          direccion: dto.direccion.trim(),
          departmentId: dto.departmentId || null,
          provinceId: dto.provinceId || null,
          districtId: dto.districtId || null,
        },
        include: {
          department: { select: { id: true, name: true } },
          province: { select: { id: true, name: true } },
          district: { select: { id: true, name: true } },
        },
      });
      await this.audit.log({ userId, action: 'CREATE', entity: 'DepartureAddress', entityId: row.id });
      return row;
    } catch (err) {
      this.handleUnique(err, 'Ya existe una dirección con ese código.');
    }
  }

  async updateDepartureAddress(
    establishmentId: string,
    id: string,
    dto: UpdateDepartureAddressDto,
    userId: string,
  ) {
    await this.ensureDepartureAddress(establishmentId, id);
    const row = await this.prisma.departureAddress.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined ? { nombre: dto.nombre.trim() } : {}),
        ...(dto.direccion !== undefined ? { direccion: dto.direccion.trim() } : {}),
        ...(dto.departmentId !== undefined ? { departmentId: dto.departmentId || null } : {}),
        ...(dto.provinceId !== undefined ? { provinceId: dto.provinceId || null } : {}),
        ...(dto.districtId !== undefined ? { districtId: dto.districtId || null } : {}),
        ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
      },
      include: {
        department: { select: { id: true, name: true } },
        province: { select: { id: true, name: true } },
        district: { select: { id: true, name: true } },
      },
    });
    await this.audit.log({ userId, action: 'UPDATE', entity: 'DepartureAddress', entityId: id, diff: dto });
    return row;
  }

  async removeDepartureAddress(establishmentId: string, id: string, userId: string) {
    await this.ensureDepartureAddress(establishmentId, id);
    await this.prisma.departureAddress.update({
      where: { id },
      data: { deletedAt: new Date(), activo: false },
    });
    await this.audit.log({ userId, action: 'DELETE', entity: 'DepartureAddress', entityId: id });
  }

  private buildSearchWhere(search?: string, fields: string[] = []) {
    const term = search?.trim();
    if (!term) return { deletedAt: null };
    return {
      deletedAt: null,
      OR: fields.map((field) => ({
        [field]: { contains: term, mode: 'insensitive' as const },
      })),
    };
  }

  private async listPaginated<T>(
    query: ShippingListQueryDto | undefined,
    findMany: (where: { deletedAt: null; OR?: Array<Record<string, { contains: string; mode: 'insensitive' }>> }, skip: number, take: number) => Promise<T[]>,
    count: (where: { deletedAt: null; OR?: Array<Record<string, { contains: string; mode: 'insensitive' }>> }) => Promise<number>,
    search?: string,
    searchFields: string[] = ['razonSocial', 'ruc', 'nombreComercial'],
  ) {
    const where = this.buildSearchWhere(search, searchFields);
    if (query?.page == null) {
      return findMany(where, 0, 500);
    }
    const { page, pageSize, skip, take } = paginationArgs(query);
    const [items, total] = await Promise.all([findMany(where, skip, take), count(where)]);
    return buildPaginatedResult(items, total, page, pageSize);
  }

  private async ensureCarrier(establishmentId: string, id: string) {
    const row = await this.prisma.shippingCarrier.findFirst({
      where: { id, establishmentId, deletedAt: null },
    });
    if (!row) throw new NotFoundException('Transportista no encontrado');
    return row;
  }

  private async ensureDriver(establishmentId: string, id: string) {
    const row = await this.prisma.shippingDriver.findFirst({
      where: { id, establishmentId, deletedAt: null },
    });
    if (!row) throw new NotFoundException('Conductor no encontrado');
    return row;
  }

  private async ensureVehicle(establishmentId: string, id: string) {
    const row = await this.prisma.shippingVehicle.findFirst({
      where: { id, establishmentId, deletedAt: null },
    });
    if (!row) throw new NotFoundException('Vehículo no encontrado');
    return row;
  }

  private async ensureDepartureAddress(establishmentId: string, id: string) {
    const row = await this.prisma.departureAddress.findFirst({
      where: { id, establishmentId, deletedAt: null },
    });
    if (!row) throw new NotFoundException('Dirección de partida no encontrada');
    return row;
  }

  private handleUnique(err: unknown, message: string): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictException(message);
    }
    throw err;
  }
}
