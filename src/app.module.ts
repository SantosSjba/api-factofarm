import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { EstablishmentsModule } from './modules/establishments/establishments.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { FilesModule } from './modules/files/files.module';
import { CustomerTypesModule } from './modules/customer-types/customer-types.module';
import { CustomersModule } from './modules/customers/customers.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BrandsModule } from './modules/brands/brands.module';
import { ProductsModule } from './modules/products/products.module';
import { ServicesModule } from './modules/services/services.module';
import { CompoundProductsModule } from './modules/compound-products/compound-products.module';
import { SeriesModule } from './modules/series/series.module';
import { InventoryMovementsModule } from './modules/inventory-movements/inventory-movements.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { LaboratoriesModule } from './modules/laboratories/laboratories.module';
import { PharmaceuticalFormsModule } from './modules/pharmaceutical-forms/pharmaceutical-forms.module';
import { ActivePrinciplesModule } from './modules/active-principles/active-principles.module';
import { UnitsModule } from './modules/units/units.module';
import { AdministrationRoutesModule } from './modules/administration-routes/administration-routes.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { WarehouseZonesModule } from './modules/warehouse-zones/warehouse-zones.module';
import { InventoryTransfersModule } from './modules/inventory-transfers/inventory-transfers.module';
import { ColdChainModule } from './modules/cold-chain/cold-chain.module';
import { InventoryPhysicalCountsModule } from './modules/inventory-physical-counts/inventory-physical-counts.module';
import { SalesModule } from './modules/sales/sales.module';
import { CashRegistersModule } from './modules/cash-registers/cash-registers.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { BillingModule } from './modules/billing/billing.module';
import { MedicosModule } from './modules/medicos/medicos.module';
import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';
import { PharmaceuticalModule } from './modules/pharmaceutical/pharmaceutical.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { AuditModule } from './modules/audit/audit.module';
import { HealthModule } from './modules/health/health.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { DeliveryOrdersModule } from './modules/delivery-orders/delivery-orders.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { AgreementsModule } from './modules/agreements/agreements.module';
import { AccountsReceivableModule } from './modules/accounts-receivable/accounts-receivable.module';
import { FinanceModule } from './modules/finance/finance.module';
import { HospitalModule } from './modules/hospital/hospital.module';
import { StaffModule } from './modules/staff/staff.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
      },
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        genReqId: (req, res) => {
          const incoming = req.headers['x-request-id'];
          const id =
            typeof incoming === 'string' && incoming.trim()
              ? incoming.trim()
              : crypto.randomUUID();
          res.setHeader('X-Request-Id', id);
          return id;
        },
        customProps: (req) => ({ requestId: req.id }),
        autoLogging: true,
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: config.get<number>('THROTTLE_TTL_MS', 60_000),
            limit: config.get<number>('THROTTLE_LIMIT', 120),
          },
        ],
      }),
    }),
    CommonModule,
    PrismaModule,
    AuthModule,
    EstablishmentsModule,
    PermissionsModule,
    FilesModule,
    UsersModule,
    CustomerTypesModule,
    CategoriesModule,
    BrandsModule,
    CustomersModule,
    ProductsModule,
    ServicesModule,
    CompoundProductsModule,
    SeriesModule,
    InventoryMovementsModule,
    DashboardModule,
    SuppliersModule,
    LaboratoriesModule,
    PharmaceuticalFormsModule,
    ActivePrinciplesModule,
    UnitsModule,
    AdministrationRoutesModule,
    WarehousesModule,
    WarehouseZonesModule,
    InventoryTransfersModule,
    ColdChainModule,
    InventoryPhysicalCountsModule,
    SalesModule,
    CashRegistersModule,
    QuotationsModule,
    PurchasesModule,
    BillingModule,
    MedicosModule,
    PrescriptionsModule,
    PharmaceuticalModule,
    ComplianceModule,
    AuditModule,
    HealthModule,
    RealtimeModule,
    DeliveryOrdersModule,
    MarketingModule,
    AgreementsModule,
    AccountsReceivableModule,
    FinanceModule,
    HospitalModule,
    StaffModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
