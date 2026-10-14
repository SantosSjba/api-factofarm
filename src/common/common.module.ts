import { PlatformSettingsService } from './settings/platform-settings.service';
import { PlatformSettingsController } from './settings/platform-settings.controller';
import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuditLogService } from './services/audit-log.service';
import { EmailService } from './services/email.service';
import { RequestContextService } from './services/request-context.service';
import { RequestContextMiddleware } from './middleware/request-context.middleware';
import { CacheService } from './cache/cache.service';
import { PermissionsGuard } from './guards/permissions.guard';
import { PermissionsCacheService } from './permissions/permissions-cache.service';
import { EstablishmentScopeService } from './scoping/establishment-scope.service';
import { EntityIntegrityService } from './services/entity-integrity.service';

@Global()
@Module({
  controllers: [PlatformSettingsController],
  providers: [
    PlatformSettingsService,
    AuditLogService,
    EmailService,
    RequestContextService,
    CacheService,
    PermissionsCacheService,
    PermissionsGuard,
    EstablishmentScopeService,
    EntityIntegrityService,
  ],
  exports: [
    PlatformSettingsService,
    AuditLogService,
    EmailService,
    RequestContextService,
    CacheService,
    PermissionsCacheService,
    PermissionsGuard,
    EstablishmentScopeService,
    EntityIntegrityService,
  ],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
