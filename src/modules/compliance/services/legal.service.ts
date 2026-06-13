import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const DOCS_ROOT = join(process.cwd(), '..', 'docs');

@Injectable()
export class LegalService {
  constructor(private readonly config: ConfigService) {}

  private readDoc(filename: string): string {
    try {
      return readFileSync(join(DOCS_ROOT, filename), 'utf8');
    } catch {
      return `# Documento no disponible\n\nConsulte al administrador del sistema.`;
    }
  }

  private getProviderInfo() {
    return {
      razonSocial:
        this.config.get<string>('COMPANY_LEGAL_NAME')?.trim() || 'FactoFarm (configurar COMPANY_LEGAL_NAME)',
      ruc: this.config.get<string>('COMPANY_RUC')?.trim() || '20XXXXXXXXX',
      domicilio:
        this.config.get<string>('COMPANY_ADDRESS')?.trim() ||
        'Lima, Perú (configurar COMPANY_ADDRESS)',
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

  getComplaintsBook() {
    return {
      version: '2026-06-11',
      title: 'Libro de reclamaciones virtual',
      legalFramework: 'Ley N° 29571 — Código de Protección y Defensa del Consumidor',
      responseDeadlineDays: 15,
      provider: this.getProviderInfo(),
      content: this.readDoc('LIBRO-RECLAMACIONES.md'),
    };
  }
}
