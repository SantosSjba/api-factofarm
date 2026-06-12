import { Global, Module } from '@nestjs/common';
import { AuditLogService } from './services/audit-log.service';
import { EmailService } from './services/email.service';
import { PermissionsGuard } from './guards/permissions.guard';

@Global()
@Module({
  providers: [AuditLogService, EmailService, PermissionsGuard],
  exports: [AuditLogService, EmailService, PermissionsGuard],
})
export class CommonModule {}
