import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { DataRetentionService } from './data-retention.service';

@Injectable()
export class DataRetentionScheduler implements OnModuleInit {
  private readonly logger = new Logger(DataRetentionScheduler.name);

  constructor(
    private readonly retention: DataRetentionService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit(): void {
    const auditCron = this.retention.getCronExpression();
    const auditJob = new CronJob(auditCron, () => {
      void this.handleAuditCron();
    });
    this.schedulerRegistry.addCronJob('data-retention-audit', auditJob);
    auditJob.start();
    this.logger.log(`Cron retención AuditLog: ${auditCron}`);

    const archiveCron = this.retention.getArchiveCronExpression();
    const archiveJob = new CronJob(archiveCron, () => {
      void this.handleArchiveCron();
    });
    this.schedulerRegistry.addCronJob('data-retention-archive', archiveJob);
    archiveJob.start();
    this.logger.log(`Cron cold storage ventas/kardex: ${archiveCron}`);
  }

  private async handleAuditCron(): Promise<void> {
    const mode = this.retention.isPurgeEnabled() ? 'purge' : 'dry-run';
    try {
      const result = await this.retention.runAuditRetention(mode);
      this.logger.log(
        `Cron AuditLog mode=${mode} count=${result.deletedCount} status=${result.status}`,
      );
    } catch (error) {
      this.logger.error(
        `Cron AuditLog falló: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async handleArchiveCron(): Promise<void> {
    const mode = this.retention.isArchiveEnabled() ? 'archive' : 'dry-run';
    try {
      const sales = await this.retention.runSalesArchive(mode);
      const kardex = await this.retention.runKardexArchive(mode);
      this.logger.log(
        `Cron archive mode=${mode} sales=${sales.deletedCount} kardex=${kardex.deletedCount}`,
      );
    } catch (error) {
      this.logger.error(
        `Cron archive falló: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
