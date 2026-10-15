import { safeError } from '../../common/logging/http-logger.config';
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

  async onModuleInit(): Promise<void> {
    this.retention.onSettingsChange(() => this.reloadJobs());
    await this.reloadJobs();
  }

  private async reloadJobs(): Promise<void> {
    for (const name of ['data-retention-audit', 'data-retention-archive']) {
      if (this.schedulerRegistry.doesExist('cron', name))
        this.schedulerRegistry.deleteCronJob(name);
    }
    const auditCron = await this.retention.getCronExpression();
    const auditJob = new CronJob(auditCron, () => {
      void this.handleAuditCron();
    });
    this.schedulerRegistry.addCronJob('data-retention-audit', auditJob);
    auditJob.start();
    this.logger.log(`Cron retención AuditLog: ${auditCron}`);

    const archiveCron = await this.retention.getArchiveCronExpression();
    const archiveJob = new CronJob(archiveCron, () => {
      void this.handleArchiveCron();
    });
    this.schedulerRegistry.addCronJob('data-retention-archive', archiveJob);
    archiveJob.start();
    this.logger.log(`Cron cold storage ventas/kardex: ${archiveCron}`);
  }

  private async handleAuditCron(): Promise<void> {
    // B-LOG-20: purge only when ENABLED + CONFIRM=I_UNDERSTAND; otherwise dry-run.
    const mode = (await this.retention.canPurge()) ? 'purge' : 'dry-run';
    if (
      (await this.retention.isPurgeEnabled()) &&
      !(await this.retention.isPurgeConfirmed())
    ) {
      this.logger.warn(
        'DATA_RETENTION_PURGE_ENABLED=true pero falta DATA_RETENTION_PURGE_CONFIRM=I_UNDERSTAND — ejecutando dry-run.',
      );
    }
    try {
      const result = await this.retention.runAuditRetention(mode);
      this.logger.log(
        `Cron AuditLog mode=${mode} count=${result.deletedCount} status=${result.status}`,
      );
    } catch (error) {
      this.logger.error({
        event: 'audit_retention_failed',
        error: safeError(error),
      });
    }
  }

  private async handleArchiveCron(): Promise<void> {
    const mode = (await this.retention.isArchiveEnabled())
      ? 'archive'
      : 'dry-run';
    try {
      const sales = await this.retention.runSalesArchive(mode);
      const kardex = await this.retention.runKardexArchive(mode);
      this.logger.log(
        `Cron archive mode=${mode} sales=${sales.deletedCount} kardex=${kardex.deletedCount}`,
      );
    } catch (error) {
      this.logger.error({ event: 'archive_failed', error: safeError(error) });
    }
  }
}
