import {
  DEFAULT_TIME_ZONE,
  formatIsoOffsetInTimeZone,
} from '../../../common/utils/timezone.util';

const UNIDADES = [
  '',
  'UNO',
  'DOS',
  'TRES',
  'CUATRO',
  'CINCO',
  'SEIS',
  'SIETE',
  'OCHO',
  'NUEVE',
  'DIEZ',
  'ONCE',
  'DOCE',
  'TRECE',
  'CATORCE',
  'QUINCE',
  'DIECISEIS',
  'DIECISIETE',
  'DIECIOCHO',
  'DIECINUEVE',
];
const DECENAS = [
  '',
  '',
  'VEINTE',
  'TREINTA',
  'CUARENTA',
  'CINCUENTA',
  'SESENTA',
  'SETENTA',
  'OCHENTA',
  'NOVENTA',
];
const CENTENAS = [
  '',
  'CIENTO',
  'DOSCIENTOS',
  'TRESCIENTOS',
  'CUATROCIENTOS',
  'QUINIENTOS',
  'SEISCIENTOS',
  'SETECIENTOS',
  'OCHOCIENTOS',
  'NOVECIENTOS',
];

function leerCentenas(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'CIEN';
  const c = Math.floor(n / 100);
  const rest = n % 100;
  const head = CENTENAS[c] ?? '';
  if (rest === 0) return head;
  if (rest < 20) return `${head} ${UNIDADES[rest]}`.trim();
  const d = Math.floor(rest / 10);
  const u = rest % 10;
  const dec = d === 2 && u > 0 ? `VEINTI${UNIDADES[u].toLowerCase()}` : DECENAS[d];
  const tail = d === 2 && u > 0 ? '' : u > 0 ? ` Y ${UNIDADES[u]}` : '';
  return `${head} ${dec}${tail}`.trim();
}

function enteroALetras(n: number): string {
  if (n === 0) return 'CERO';
  if (n < 1000) return leerCentenas(n);
  if (n < 1_000_000) {
    const miles = Math.floor(n / 1000);
    const rest = n % 1000;
    const milesTxt = miles === 1 ? 'MIL' : `${enteroALetras(miles)} MIL`;
    return rest ? `${milesTxt} ${enteroALetras(rest)}` : milesTxt;
  }
  const millones = Math.floor(n / 1_000_000);
  const rest = n % 1_000_000;
  const millTxt = millones === 1 ? 'UN MILLON' : `${enteroALetras(millones)} MILLONES`;
  return rest ? `${millTxt} ${enteroALetras(rest)}` : millTxt;
}

export function buildFactilizaLegend(total: number, moneda = 'SOLES'): string {
  const [entero, dec] = total.toFixed(2).split('.');
  const letras = enteroALetras(Number.parseInt(entero, 10));
  return `SON ${letras} CON ${dec}/100 ${moneda}`;
}

export function mapFactilizaTipoDoc(documentType: string): string {
  const map: Record<string, string> = {
    FACTURA: '01',
    BOLETA: '03',
    NOTA_CREDITO: '07',
    NOTA_DEBITO: '08',
  };
  return map[documentType] ?? '03';
}

export function mapFactilizaAfectadoTipo(documentType: 'FACTURA' | 'BOLETA'): string {
  return documentType === 'FACTURA' ? '01' : '03';
}

/** Fecha/hora de emisión CPE con offset (compat: nombre histórico). */
export function peruEmissionDate(isoDate: string, timeZone = DEFAULT_TIME_ZONE): string {
  return formatIsoOffsetInTimeZone(isoDate, timeZone);
}

export function roundMoney(value: string | number): number {
  return Math.round(Number(value) * 100) / 100;
}

export type FactilizaOkResponse = {
  status?: number;
  success?: boolean;
  message?: string;
  data?: {
    hash?: string;
    sunatResponse?: {
      success?: boolean;
      cdrZip?: string;
      cdrResponse?: {
        id?: string;
        code?: string;
        description?: string;
        notes?: string[];
      };
    };
    pdf?: string;
    xml?: string;
    cdr?: string;
    base64?: string;
    content?: string;
  };
};

export function extractBase64Artifact(payload: FactilizaOkResponse): Buffer | null {
  const data = payload.data;
  if (!data) return null;
  const raw = data.base64 ?? data.pdf ?? data.xml ?? data.cdr ?? data.content;
  if (!raw || typeof raw !== 'string') return null;
  return Buffer.from(raw, 'base64');
}
