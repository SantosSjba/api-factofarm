import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import {
  encryptBillingSecret,
  decryptBillingSecret,
} from '../utils/billing-crypto.util';
import {
  settingDefinitions,
  SettingKey,
  settingsSchema,
} from './settings.catalog';

@Injectable()
export class PlatformSettingsService {
  private snapshot: Map<string, string> | null = null;
  private snapshotAt = 0;
  private loading?: Promise<Map<string, string>>;
  private readonly listeners = new Set<() => Promise<void>>();

  onChange(listener: () => Promise<void>): void {
    this.listeners.add(listener);
  }

  private async values(): Promise<Map<string, string>> {
    if (this.snapshot && Date.now() - this.snapshotAt < 1000)
      return this.snapshot;
    if (!this.loading) {
      this.loading = this.prisma.platformSetting
        .findMany()
        .then((rows) => {
          const snapshot = new Map(rows.map((row) => [row.key, row.value]));
          this.snapshot = snapshot;
          this.snapshotAt = Date.now();
          return snapshot;
        })
        .finally(() => {
          this.loading = undefined;
        });
    }
    return this.loading;
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private encryptionKey(): string {
    return (
      this.config.get<string>('SETTINGS_ENCRYPTION_KEY') ||
      this.config.getOrThrow<string>('BILLING_ENCRYPTION_KEY')
    );
  }

  async get(key: SettingKey): Promise<string> {
    const value = (await this.values()).get(key);
    if (value !== undefined)
      return key === 'SMTP_PASS'
        ? decryptBillingSecret(value, this.encryptionKey())
        : value;
    const fallbackKey = ['SITE_URL', 'PASSWORD_RESET_BASE_URL'].includes(key)
      ? 'FRONTEND_URL'
      : key;
    return String(
      this.config.get(key) ??
        this.config.get(fallbackKey) ??
        settingDefinitions[key].default,
    );
  }

  async list() {
    const values = await this.values();
    return Promise.all(
      Object.entries(settingDefinitions).map(async ([key, definition]) => {
        const stored = values.get(key);
        const secret = 'secret' in definition && definition.secret;
        return {
          key,
          label: definition.label,
          secret,
          value: secret ? '' : await this.get(key as SettingKey),
          configured: secret
            ? Boolean(stored || this.config.get(key))
            : undefined,
          source: stored !== undefined ? 'panel' : 'environment',
        };
      }),
    );
  }

  async update(input: unknown, actorId: string) {
    const validation = settingsSchema.validate(input, {
      abortEarly: false,
    }) as import('joi').ValidationResult<
      Record<string, string | number | boolean>
    >;
    if (validation.error)
      throw new BadRequestException({
        code: 'INVALID_SETTINGS',
        message: 'Configuración inválida',
        details: validation.error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message,
        })),
      });
    const entries = Object.entries(validation.value);
    await this.prisma.$transaction(async (tx) => {
      for (const [key, raw] of entries) {
        // Un secreto vacío conserva la credencial; null/valores desconocidos son rechazados.
        if (key === 'SMTP_PASS' && raw === '') continue;
        const stored =
          key === 'SMTP_PASS'
            ? encryptBillingSecret(String(raw), this.encryptionKey())
            : String(raw);
        await tx.platformSetting.upsert({
          where: { key },
          create: { key, value: stored },
          update: { value: stored },
        });
      }
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'UPDATE',
          entity: 'PlatformSettings',
          diff: { keys: entries.map(([key]) => key) },
        },
      });
    });
    this.snapshot = null;
    await Promise.all([...this.listeners].map((listener) => listener()));
    return this.list();
  }

  async publicInfo(): Promise<Record<string, string>> {
    const keys: SettingKey[] = [
      'CONTACT_EMAIL',
      'CONTACT_WHATSAPP',
      'COMPANY_LEGAL_NAME',
      'COMPANY_RUC',
      'COMPANY_ADDRESS',
      'SITE_URL',
    ];
    return Object.fromEntries(
      await Promise.all(
        keys.map(
          async (key): Promise<[string, string]> => [key, await this.get(key)],
        ),
      ),
    );
  }
}
