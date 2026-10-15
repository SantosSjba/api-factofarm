import { PlatformSettingsService } from '../../../common/settings/platform-settings.service';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Injectable } from '@nestjs/common';

/** En Docker/prod: `/app/docs`. En monorepo local también puede resolverse desde cwd. */
const DOCS_ROOT = join(process.cwd(), 'docs');

@Injectable()
export class LegalService {
  constructor(private readonly settings: PlatformSettingsService) {}

  private readDoc(filename: string): string {
    try {
      return readFileSync(join(DOCS_ROOT, filename), 'utf8');
    } catch {
      return `# Documento no disponible\n\nConsulte al administrador del sistema.`;
    }
  }

  private async getProviderInfo() {
    return {
      razonSocial:
        (await this.settings.get('COMPANY_LEGAL_NAME'))?.trim() ||
        'FACTOSYS PERU S.A.C.',
      ruc: (await this.settings.get('COMPANY_RUC'))?.trim() || '20614608952',
      domicilio:
        (await this.settings.get('COMPANY_ADDRESS'))?.trim() ||
        'Trujillo, La Libertad, Perú. Atendemos todo el Perú (24 departamentos y Callao).',
    };
  }

  getPrivacyPolicy() {
    return {
      version: '2026-06-11',
      title: 'Política de privacidad (LPDP Ley 29733)',
      content: this.readDoc('LPDP-POLICY.md'),
    };
  }

  getTermsOfUse() {
    return {
      version: '2026-06-11',
      title: 'Términos de uso de la plataforma FactoFarm',
      content: this.readDoc('TERMS-OF-USE.md'),
    };
  }

  async getComplaintsBook() {
    return {
      version: '2026-06-11',
      title: 'Libro de reclamaciones virtual',
      legalFramework:
        'Ley N° 29571 — Código de Protección y Defensa del Consumidor',
      responseDeadlineDays: 15,
      provider: await this.getProviderInfo(),
      content: this.readDoc('LIBRO-RECLAMACIONES.md'),
    };
  }
}
