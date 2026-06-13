import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Injectable } from '@nestjs/common';

const DOCS_ROOT = join(process.cwd(), '..', 'docs');

@Injectable()
export class LegalService {
  private readDoc(filename: string): string {
    try {
      return readFileSync(join(DOCS_ROOT, filename), 'utf8');
    } catch {
      return `# Documento no disponible\n\nConsulte al administrador del sistema.`;
    }
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
}
