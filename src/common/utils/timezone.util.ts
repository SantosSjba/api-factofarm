/** Zona horaria por defecto del producto (Perú). */
export const DEFAULT_TIME_ZONE = 'America/Lima';

const COMMON_TIME_ZONES = [
  'America/Lima',
  'America/Bogota',
  'America/Guayaquil',
  'America/La_Paz',
  'America/Santiago',
  'America/Argentina/Buenos_Aires',
  'America/Mexico_City',
  'America/Panama',
  'America/Caracas',
  'America/Sao_Paulo',
  'UTC',
] as const;

export type CommonTimeZone = (typeof COMMON_TIME_ZONES)[number];

export function listCommonTimeZones(): ReadonlyArray<{ value: string; label: string }> {
  return COMMON_TIME_ZONES.map((value) => ({
    value,
    label: value === 'UTC' ? 'UTC' : value.replace('America/', '').replace(/_/g, ' '),
  }));
}

export function normalizeTimeZone(value: string | null | undefined): string {
  const tz = value?.trim() || DEFAULT_TIME_ZONE;
  if (!isValidTimeZone(tz)) {
    return DEFAULT_TIME_ZONE;
  }
  return tz;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

/** YYYY-MM-DD en la zona indicada. */
export function formatDateYmdInTimeZone(date: Date, timeZone = DEFAULT_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: normalizeTimeZone(timeZone),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const y = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const m = parts.find((p) => p.type === 'month')?.value ?? '01';
  const d = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${y}-${m}-${d}`;
}

export function formatDateTimeInTimeZone(
  date: Date,
  timeZone = DEFAULT_TIME_ZONE,
  locale = 'es-PE',
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: normalizeTimeZone(timeZone),
    dateStyle: 'short',
    timeStyle: 'medium',
    ...options,
  }).format(date);
}

/** Hora civil "00".."23" en la zona indicada. */
export function formatHourInTimeZone(date: Date, timeZone = DEFAULT_TIME_ZONE): string {
  const parts = getZonedParts(date, normalizeTimeZone(timeZone));
  return String(parts.hour).padStart(2, '0');
}

/**
 * Datetime local con offset numérico (p. ej. 2026-07-09T10:00:00.000-05:00),
 * útil para emisión CPE SUNAT.
 */
export function formatIsoOffsetInTimeZone(
  date: Date | string,
  timeZone = DEFAULT_TIME_ZONE,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${String(date)}`);
  }
  const tz = normalizeTimeZone(timeZone);
  const parts = getZonedParts(d, tz);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    parts.ms,
  );
  const offsetMinutes = Math.round((asUtc - d.getTime()) / 60_000);
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const oh = String(Math.floor(abs / 60)).padStart(2, '0');
  const om = String(abs % 60).padStart(2, '0');
  const yyyy = String(parts.year).padStart(4, '0');
  const mm = String(parts.month).padStart(2, '0');
  const dd = String(parts.day).padStart(2, '0');
  const hh = String(parts.hour).padStart(2, '0');
  const mi = String(parts.minute).padStart(2, '0');
  const ss = String(parts.second).padStart(2, '0');
  const mss = String(parts.ms).padStart(3, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}.${mss}${sign}${oh}:${om}`;
}

/**
 * Inicio (inclusive) y fin (exclusive) del día civil en `timeZone`,
 * expresados como instantes UTC (Date).
 */
export function dayBoundsInTimeZone(
  date: Date = new Date(),
  timeZone = DEFAULT_TIME_ZONE,
): { start: Date; end: Date; ymd: string } {
  const tz = normalizeTimeZone(timeZone);
  const ymd = formatDateYmdInTimeZone(date, tz);
  const start = zonedCivilTimeToUtc(ymd, 0, 0, 0, 0, tz);
  const next = addCalendarDays(ymd, 1);
  const end = zonedCivilTimeToUtc(next, 0, 0, 0, 0, tz);
  return { start, end, ymd };
}


/** Primer día del mes civil (YYYY-MM) y fin exclusivo del mes en la zona. */
export function monthBoundsInTimeZone(
  yearMonth: string,
  timeZone = DEFAULT_TIME_ZONE,
): { start: Date; end: Date; fromYmd: string; toYmd: string } {
  const tz = normalizeTimeZone(timeZone);
  const [ys, ms] = yearMonth.split('-');
  const y = Number(ys);
  const m = Number(ms);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
    throw new Error(`Invalid yearMonth: ${yearMonth}`);
  }
  const fromYmd = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-01`;
  const nextY = m === 12 ? y + 1 : y;
  const nextM = m === 12 ? 1 : m + 1;
  const nextYmd = `${String(nextY).padStart(4, '0')}-${String(nextM).padStart(2, '0')}-01`;
  const toYmd = addCalendarDays(nextYmd, -1);
  return {
    start: zonedCivilTimeToUtc(fromYmd, 0, 0, 0, 0, tz),
    end: zonedCivilTimeToUtc(nextYmd, 0, 0, 0, 0, tz),
    fromYmd,
    toYmd,
  };
}

/** Rango [fromYmd 00:00, toYmd+1 00:00) en la zona. */
export function dateRangeBoundsInTimeZone(
  fromYmd: string,
  toYmd: string,
  timeZone = DEFAULT_TIME_ZONE,
): { start: Date; end: Date } {
  const tz = normalizeTimeZone(timeZone);
  const start = zonedCivilTimeToUtc(fromYmd, 0, 0, 0, 0, tz);
  const end = zonedCivilTimeToUtc(addCalendarDays(toYmd, 1), 0, 0, 0, 0, tz);
  return { start, end };
}

function addCalendarDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  const yy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(utc.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/**
 * Convierte fecha civil + hora en `timeZone` a instante UTC.
 * Usa iteración sobre el offset (sin dependencias externas).
 */
function zonedCivilTimeToUtc(
  ymd: string,
  hour: number,
  minute: number,
  second: number,
  ms: number,
  timeZone: string,
): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  let guess = Date.UTC(y, m - 1, d, hour, minute, second, ms);
  for (let i = 0; i < 3; i++) {
    const parts = getZonedParts(new Date(guess), timeZone);
    const asUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
      parts.ms,
    );
    const desired = Date.UTC(y, m - 1, d, hour, minute, second, ms);
    const delta = desired - asUtc;
    guess += delta;
    if (delta === 0) break;
  }
  return new Date(guess);
}

function getZonedParts(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    fractionalSecondDigits: 3,
  });
  const parts = fmt.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? '0');
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
    ms: get('fractionalSecond'),
  };
}
