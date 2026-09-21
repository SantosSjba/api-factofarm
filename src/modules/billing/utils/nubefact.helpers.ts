import { DEFAULT_TIME_ZONE, formatDateYmdInTimeZone } from '../../../common/utils/timezone.util';

/** Header oficial Nubefact: `Authorization: Token token="…"`. */
export function buildNubefactAuthHeader(apiToken: string): string {
  return `Token token="${apiToken.trim()}"`;
}

/** Fecha de emisión Nubefact: `DD-MM-YYYY` en la zona del establecimiento. */
export function nubefactEmissionDate(isoDate: string, timeZone = DEFAULT_TIME_ZONE): string {
  const ymd = formatDateYmdInTimeZone(new Date(isoDate), timeZone);
  const [year, month, day] = ymd.split('-');
  return `${day}-${month}-${year}`;
}
