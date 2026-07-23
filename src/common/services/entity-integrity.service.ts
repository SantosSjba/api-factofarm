import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AccountPayableStatus,
  AccountReceivableStatus,
  CashSessionStatus,
  DeliveryOrderStatus,
  ProductSerialStatus,
  PurchaseOrderStatus,
  UserRole,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Validaciones de integridad antes de soft-delete / hard-delete.
 * Soft-delete no dispara onDelete Restrict de Prisma; estas reglas lo compensan.
 */
@Injectable()
export class EntityIntegrityService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCanDeleteProduct(productId: string): Promise<void> {
    const [saleItems, stockAgg, lotStock, serials, poItems, receiptItems, compoundUses] =
      await Promise.all([
        this.prisma.saleItem.count({ where: { productId } }),
        this.prisma.productWarehouseStock.aggregate({
          where: { productId, cantidad: { gt: 0 } },
          _count: { _all: true },
        }),
        this.prisma.productLotStock.count({
          where: { productId, deletedAt: null, stock: { gt: 0 } },
        }),
        this.prisma.productSerial.count({
          where: {
            productId,
            deletedAt: null,
            OR: [
              { estado: { in: [ProductSerialStatus.DISPONIBLE, ProductSerialStatus.RESERVADO] } },
              { vendido: true },
            ],
          },
        }),
        this.prisma.purchaseOrderItem.count({
          where: { productId, purchaseOrder: { deletedAt: null } },
        }),
        this.prisma.goodsReceiptItem.count({
          where: { productId, goodsReceipt: { deletedAt: null } },
        }),
        this.prisma.compoundProductItem.count({
          where: { productId, compoundProduct: { deletedAt: null } },
        }),
      ]);

    const reasons: string[] = [];
    if (saleItems > 0) reasons.push('ventas');
    if (stockAgg._count._all > 0 || lotStock > 0) reasons.push('stock');
    if (serials > 0) reasons.push('series de producto');
    if (poItems > 0) reasons.push('órdenes de compra');
    if (receiptItems > 0) reasons.push('ingresos de mercadería');
    if (compoundUses > 0) reasons.push('productos compuestos');

    if (reasons.length) {
      throw new BadRequestException(
        `No se puede eliminar el producto: tiene ${reasons.join(', ')} asociados. Desactívelo en su lugar.`,
      );
    }
  }

  async assertCanDeleteWarehouse(warehouseId: string): Promise<void> {
    const [stock, lots, serials, sales, inbound, transfers, receipts, pos, deliveries] =
      await Promise.all([
        this.prisma.productWarehouseStock.count({
          where: { warehouseId, cantidad: { gt: 0 } },
        }),
        this.prisma.productLotStock.count({
          where: { warehouseId, deletedAt: null, stock: { gt: 0 } },
        }),
        this.prisma.productSerial.count({
          where: {
            warehouseId,
            deletedAt: null,
            estado: { not: ProductSerialStatus.ANULADO },
          },
        }),
        this.prisma.sale.count({ where: { warehouseId, deletedAt: null } }),
        this.prisma.inventoryInboundMovement.count({
          where: { warehouseId, deletedAt: null },
        }),
        this.prisma.inventoryStockTransfer.count({
          where: {
            deletedAt: null,
            OR: [{ fromWarehouseId: warehouseId }, { toWarehouseId: warehouseId }],
          },
        }),
        this.prisma.goodsReceipt.count({ where: { warehouseId, deletedAt: null } }),
        this.prisma.purchaseOrder.count({ where: { warehouseId, deletedAt: null } }),
        this.prisma.deliveryOrder.count({ where: { warehouseId, deletedAt: null } }),
      ]);

    const reasons: string[] = [];
    if (stock > 0 || lots > 0) reasons.push('stock');
    if (serials > 0) reasons.push('series');
    if (sales > 0) reasons.push('ventas');
    if (inbound > 0 || transfers > 0) reasons.push('movimientos de inventario');
    if (receipts > 0 || pos > 0) reasons.push('compras/ingresos');
    if (deliveries > 0) reasons.push('entregas');

    if (reasons.length) {
      throw new BadRequestException(
        `No se puede eliminar el almacén: tiene ${reasons.join(', ')} asociados.`,
      );
    }
  }

  async assertCanDeleteEstablishment(establishmentId: string): Promise<void> {
    const [sales, docs, openSessions, users, stockRows, pos, ar, ap] = await Promise.all([
      this.prisma.sale.count({ where: { establishmentId, deletedAt: null } }),
      this.prisma.electronicDocument.count({
        where: { establishmentId, deletedAt: null },
      }),
      this.prisma.cashSession.count({
        where: {
          estado: CashSessionStatus.ABIERTA,
          cashRegister: { establishmentId, deletedAt: null },
        },
      }),
      this.prisma.user.count({
        where: { establecimientoId: establishmentId, deletedAt: null },
      }),
      this.prisma.productWarehouseStock.count({
        where: {
          cantidad: { gt: 0 },
          warehouse: { establishmentId, deletedAt: null },
        },
      }),
      this.prisma.purchaseOrder.count({
        where: {
          establishmentId,
          deletedAt: null,
          estado: {
            notIn: [PurchaseOrderStatus.ANULADA, PurchaseOrderStatus.CERRADA],
          },
        },
      }),
      this.prisma.accountReceivable.count({
        where: {
          establishmentId,
          deletedAt: null,
          saldo: { gt: 0 },
          estado: { not: AccountReceivableStatus.ANULADA },
        },
      }),
      this.prisma.accountPayable.count({
        where: {
          establishmentId,
          deletedAt: null,
          saldo: { gt: 0 },
          estado: { not: AccountPayableStatus.ANULADA },
        },
      }),
    ]);

    const reasons: string[] = [];
    if (sales > 0) reasons.push('ventas');
    if (docs > 0) reasons.push('comprobantes electrónicos');
    if (openSessions > 0) reasons.push('sesiones de caja abiertas');
    if (users > 0) reasons.push('usuarios asignados');
    if (stockRows > 0) reasons.push('inventario con stock');
    if (pos > 0) reasons.push('órdenes de compra abiertas');
    if (ar > 0 || ap > 0) reasons.push('cuentas por cobrar/pagar');

    if (reasons.length) {
      throw new BadRequestException(
        `No se puede desactivar el establecimiento: tiene ${reasons.join(', ')}.`,
      );
    }
  }

  async assertCanDeleteBillingSeries(
    establishmentId: string,
    seriesId: string,
  ): Promise<{ numero: string; documentType: string }> {
    const series = await this.prisma.establishmentSeries.findFirst({
      where: { id: seriesId, establishmentId },
      select: { id: true, numero: true, documentType: true },
    });
    if (!series) {
      throw new BadRequestException('Serie no encontrada para el establecimiento');
    }

    const [sales, docs, siblings] = await Promise.all([
      this.prisma.sale.count({
        where: {
          establishmentId,
          serie: series.numero,
          deletedAt: null,
        },
      }),
      this.prisma.electronicDocument.count({
        where: {
          establishmentId,
          serie: series.numero,
          deletedAt: null,
        },
      }),
      this.prisma.establishmentSeries.count({
        where: {
          establishmentId,
          documentType: series.documentType,
          id: { not: seriesId },
        },
      }),
    ]);

    if (sales > 0 || docs > 0) {
      throw new BadRequestException(
        'No se puede eliminar la serie: ya fue usada en ventas o comprobantes electrónicos.',
      );
    }
    if (siblings === 0) {
      throw new BadRequestException(
        'No se puede eliminar la única serie de este tipo de documento. Agregue otra antes de borrarla.',
      );
    }
    return series;
  }

  async assertCanDeleteCustomer(customerId: string): Promise<void> {
    const [openAr, openDeliveries] = await Promise.all([
      this.prisma.accountReceivable.count({
        where: {
          customerId,
          deletedAt: null,
          saldo: { gt: 0 },
          estado: { not: AccountReceivableStatus.ANULADA },
        },
      }),
      this.prisma.deliveryOrder.count({
        where: {
          customerId,
          deletedAt: null,
          estado: {
            in: [
              DeliveryOrderStatus.RECIBIDO,
              DeliveryOrderStatus.PREPARANDO,
              DeliveryOrderStatus.EN_CAMINO,
            ],
          },
        },
      }),
    ]);

    if (openAr > 0) {
      throw new BadRequestException(
        'No se puede eliminar el cliente: tiene cuentas por cobrar pendientes.',
      );
    }
    if (openDeliveries > 0) {
      throw new BadRequestException(
        'No se puede eliminar el cliente: tiene entregas pendientes.',
      );
    }
  }

  async assertCanDeleteSupplier(supplierId: string): Promise<void> {
    const [openPo, openAp] = await Promise.all([
      this.prisma.purchaseOrder.count({
        where: {
          supplierId,
          deletedAt: null,
          estado: {
            notIn: [PurchaseOrderStatus.ANULADA, PurchaseOrderStatus.CERRADA],
          },
        },
      }),
      this.prisma.accountPayable.count({
        where: {
          supplierId,
          deletedAt: null,
          saldo: { gt: 0 },
          estado: { not: AccountPayableStatus.ANULADA },
        },
      }),
    ]);

    if (openPo > 0) {
      throw new BadRequestException(
        'No se puede eliminar el proveedor: tiene órdenes de compra abiertas.',
      );
    }
    if (openAp > 0) {
      throw new BadRequestException(
        'No se puede eliminar el proveedor: tiene cuentas por pagar pendientes.',
      );
    }
  }

  async assertCanDeleteUser(userId: string, actorId?: string): Promise<void> {
    if (actorId && actorId === userId) {
      throw new BadRequestException('No puede eliminar su propio usuario.');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, role: true, tenantId: true },
    });
    if (!user) return;

    const openSession = await this.prisma.cashSession.count({
      where: { userId, estado: CashSessionStatus.ABIERTA },
    });
    if (openSession > 0) {
      throw new BadRequestException(
        'No se puede eliminar el usuario: tiene una sesión de caja abierta. Ciérrela primero.',
      );
    }

    const tenantAdminRoles: UserRole[] = [
      UserRole.ADMINISTRADOR,
      UserRole.ADMIN_CADENA,
    ];
    if (tenantAdminRoles.includes(user.role) && user.tenantId) {
      const otherAdmins = await this.prisma.user.count({
        where: {
          tenantId: user.tenantId,
          deletedAt: null,
          id: { not: userId },
          role: { in: tenantAdminRoles },
        },
      });
      if (otherAdmins === 0) {
        throw new BadRequestException(
          'No se puede eliminar el último administrador del cliente.',
        );
      }
    }
  }

  async assertCanDeleteProductSerial(serialId: string): Promise<void> {
    const row = await this.prisma.productSerial.findFirst({
      where: { id: serialId, deletedAt: null },
      select: { estado: true, vendido: true },
    });
    if (!row) return;
    if (
      row.vendido ||
      row.estado === ProductSerialStatus.VENDIDO ||
      row.estado === ProductSerialStatus.RESERVADO
    ) {
      throw new BadRequestException(
        'No se puede eliminar la serie: está vendida o reservada.',
      );
    }
  }

  async assertCanDeleteAgreement(agreementId: string): Promise<void> {
    const [statements, sales, openAr, customers] = await Promise.all([
      this.prisma.agreementBillingStatement.count({ where: { agreementId } }),
      this.prisma.sale.count({ where: { agreementId, deletedAt: null } }),
      this.prisma.accountReceivable.count({
        where: {
          agreementId,
          deletedAt: null,
          saldo: { gt: 0 },
          estado: { not: AccountReceivableStatus.ANULADA },
        },
      }),
      this.prisma.customer.count({
        where: { agreementId, deletedAt: null },
      }),
    ]);

    if (statements > 0 || sales > 0 || openAr > 0 || customers > 0) {
      throw new BadRequestException(
        'No se puede eliminar el convenio: tiene ventas, liquidaciones, clientes o cuentas por cobrar asociadas.',
      );
    }
  }

  async assertCanDeletePharmacistLicense(licenseId: string): Promise<void> {
    const [titular, controlledSales] = await Promise.all([
      this.prisma.establishment.count({
        where: { titularPharmacistLicenseId: licenseId, deletedAt: null },
      }),
      this.prisma.sale.count({
        where: { controlledPharmacistLicenseId: licenseId, deletedAt: null },
      }),
    ]);
    if (titular > 0) {
      throw new BadRequestException(
        'No se puede eliminar la colegiatura: es titular de un establecimiento.',
      );
    }
    if (controlledSales > 0) {
      throw new BadRequestException(
        'No se puede eliminar la colegiatura: autorizó ventas de productos controlados.',
      );
    }
  }

  async assertCanDeleteUnit(unitId: string): Promise<void> {
    const [products, services, compounds, presentations] = await Promise.all([
      this.prisma.product.count({ where: { unitId, deletedAt: null } }),
      this.prisma.service.count({ where: { unitId, deletedAt: null } }),
      this.prisma.compoundProduct.count({ where: { unitId, deletedAt: null } }),
      this.prisma.productPresentation.count({
        where: { unitId, product: { deletedAt: null } },
      }),
    ]);
    if (products + services + compounds + presentations > 0) {
      throw new BadRequestException(
        'No se puede eliminar la unidad de medida: está en uso por productos o servicios.',
      );
    }
  }

  async assertCanDeleteCategory(categoryId: string): Promise<void> {
    const [products, services, compounds, children] = await Promise.all([
      this.prisma.product.count({ where: { categoryId, deletedAt: null } }),
      this.prisma.service.count({ where: { categoryId, deletedAt: null } }),
      this.prisma.compoundProduct.count({ where: { categoryId, deletedAt: null } }),
      this.prisma.category.count({ where: { parentId: categoryId, deletedAt: null } }),
    ]);
    if (products + services + compounds > 0) {
      throw new BadRequestException(
        'No se puede eliminar la categoría: tiene productos o servicios asociados.',
      );
    }
    if (children > 0) {
      throw new BadRequestException(
        'No se puede eliminar la categoría: tiene subcategorías. Elimínelas o reasígnelas primero.',
      );
    }
  }

  async assertCanDeleteBrand(brandId: string): Promise<void> {
    const products = await this.prisma.product.count({
      where: { brandId, deletedAt: null },
    });
    if (products > 0) {
      throw new BadRequestException(
        'No se puede eliminar la marca: tiene productos asociados.',
      );
    }
  }

  async assertCanDeleteCustomerType(customerTypeId: string): Promise<void> {
    const customers = await this.prisma.customer.count({
      where: { customerTypeId, deletedAt: null },
    });
    if (customers > 0) {
      throw new BadRequestException(
        'No se puede eliminar el tipo de cliente: hay clientes asignados.',
      );
    }
  }

  async assertCanDeleteAdministrationRoute(routeId: string): Promise<void> {
    const products = await this.prisma.product.count({
      where: { administrationRouteId: routeId, deletedAt: null },
    });
    if (products > 0) {
      throw new BadRequestException(
        'No se puede eliminar la vía de administración: está asignada a productos.',
      );
    }
  }

  async assertCanDeleteWarehouseZone(zoneId: string): Promise<void> {
    const logs = await this.prisma.coldChainTemperatureLog.count({
      where: { warehouseZoneId: zoneId },
    });
    if (logs > 0) {
      throw new BadRequestException(
        'No se puede eliminar la zona: tiene registros de temperatura de cadena de frío.',
      );
    }
  }

  async assertCanDeleteMedico(medicoId: string): Promise<void> {
    const prescriptions = await this.prisma.prescription.count({
      where: { medicoId, deletedAt: null },
    });
    if (prescriptions > 0) {
      throw new BadRequestException(
        'No se puede eliminar el médico: tiene recetas asociadas.',
      );
    }
  }

  async assertCanDeleteRegulatedPrice(id: string): Promise<void> {
    const row = await this.prisma.regulatedDrugPrice.findFirst({
      where: { id, deletedAt: null },
      select: { codigoDigemid: true },
    });
    if (!row?.codigoDigemid) return;
    const [products, services] = await Promise.all([
      this.prisma.product.count({
        where: { codigoMedicamentoDigemid: row.codigoDigemid, deletedAt: null },
      }),
      this.prisma.service.count({
        where: { codigoMedicamentoDigemid: row.codigoDigemid, deletedAt: null },
      }),
    ]);
    if (products + services > 0) {
      throw new BadRequestException(
        'No se puede eliminar el precio regulado: hay productos con ese código DIGEMID.',
      );
    }
  }

  async assertCanDeletePromotion(promotionId: string): Promise<void> {
    const redemptions = await this.prisma.promotionRedemption.count({
      where: { promotionId },
    });
    if (redemptions > 0) {
      throw new BadRequestException(
        'No se puede eliminar la promoción: ya fue canjeada en ventas. Desactívela.',
      );
    }
  }

  async assertCanDeleteShippingCarrier(carrierId: string): Promise<void> {
    const [drivers, vehicles] = await Promise.all([
      this.prisma.shippingDriver.count({ where: { carrierId, deletedAt: null } }),
      this.prisma.shippingVehicle.count({ where: { carrierId, deletedAt: null } }),
    ]);
    if (drivers + vehicles > 0) {
      throw new BadRequestException(
        'No se puede eliminar el transportista: tiene conductores o vehículos asociados.',
      );
    }
  }

  async assertCanDeleteLaboratory(laboratoryId: string): Promise<void> {
    const lab = await this.prisma.laboratory.findFirst({
      where: { id: laboratoryId, deletedAt: null },
      select: { nombre: true },
    });
    if (!lab) return;
    const [products, services] = await Promise.all([
      this.prisma.product.count({
        where: { marcaLaboratorio: lab.nombre, deletedAt: null },
      }),
      this.prisma.service.count({
        where: { marcaLaboratorio: lab.nombre, deletedAt: null },
      }),
    ]);
    if (products + services > 0) {
      throw new BadRequestException(
        'No se puede eliminar el laboratorio: está referenciado en productos o servicios.',
      );
    }
  }

  async assertCanDeletePharmaceuticalForm(formId: string): Promise<void> {
    const form = await this.prisma.pharmaceuticalForm.findFirst({
      where: { id: formId, deletedAt: null },
      select: { nombre: true },
    });
    if (!form) return;
    const [products, services] = await Promise.all([
      this.prisma.product.count({
        where: { formaFarmaceutica: form.nombre, deletedAt: null },
      }),
      this.prisma.service.count({
        where: { formaFarmaceutica: form.nombre, deletedAt: null },
      }),
    ]);
    if (products + services > 0) {
      throw new BadRequestException(
        'No se puede eliminar la forma farmacéutica: está asignada a productos o servicios.',
      );
    }
  }

  async assertCanDeleteActivePrinciple(principleId: string): Promise<void> {
    const principle = await this.prisma.activePrinciple.findFirst({
      where: { id: principleId, deletedAt: null },
      select: { nombre: true },
    });
    if (!principle) return;
    const nombre = principle.nombre;
    const [products, services, interactions] = await Promise.all([
      this.prisma.product.count({
        where: { principioActivo: nombre, deletedAt: null },
      }),
      this.prisma.service.count({
        where: { principioActivo: nombre, deletedAt: null },
      }),
      this.prisma.drugInteraction.count({
        where: {
          deletedAt: null,
          OR: [{ principioA: nombre }, { principioB: nombre }],
        },
      }),
    ]);
    if (products + services + interactions > 0) {
      throw new BadRequestException(
        'No se puede eliminar el principio activo: está en productos, servicios o interacciones.',
      );
    }
  }

  /** Impide “deshacer” una serie vendida/reservada vía update o import. */
  assertCanMutateProductSerial(current: {
    estado: ProductSerialStatus;
    vendido: boolean;
  }): void {
    if (
      current.vendido ||
      current.estado === ProductSerialStatus.VENDIDO ||
      current.estado === ProductSerialStatus.RESERVADO
    ) {
      throw new BadRequestException(
        'No se puede modificar una serie vendida o reservada.',
      );
    }
  }

  async assertCashRegisterHasNoOpenSession(cashRegisterId: string): Promise<void> {
    const open = await this.prisma.cashSession.count({
      where: { cashRegisterId, estado: CashSessionStatus.ABIERTA },
    });
    if (open > 0) {
      throw new BadRequestException(
        'La caja ya tiene una sesión abierta. Ciérrela antes de abrir otra.',
      );
    }
  }
}
