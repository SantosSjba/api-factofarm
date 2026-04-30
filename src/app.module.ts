import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { EstablishmentsModule } from './modules/establishments/establishments.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { FilesModule } from './modules/files/files.module';
import { CustomerTypesModule } from './modules/customer-types/customer-types.module';
import { CustomersModule } from './modules/customers/customers.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BrandsModule } from './modules/brands/brands.module';
import { ProductsModule } from './modules/products/products.module';
import { ServicesModule } from './modules/services/services.module';
import { CompoundProductsModule } from './modules/compound-products/compound-products.module';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
