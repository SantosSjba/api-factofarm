import {
  DEFAULT_TIME_ZONE,
  dayBoundsInTimeZone,
  formatDateYmdInTimeZone,
  formatHourInTimeZone,
  formatIsoOffsetInTimeZone,
  isValidTimeZone,
  monthBoundsInTimeZone,
  normalizeTimeZone,
  parseYearMonth,
} from './timezone.util';

describe('timezone.util', () => {
  it('normaliza inválidos a America/Lima', () => {
    expect(normalizeTimeZone('Nope/City')).toBe(DEFAULT_TIME_ZONE);
    expect(normalizeTimeZone(null)).toBe(DEFAULT_TIME_ZONE);
    expect(isValidTimeZone('America/Lima')).toBe(true);
  });

  it('calcula día civil Lima alrededor de medianoche UTC', () => {
    // 2026-07-24 04:30 UTC = 2026-07-23 23:30 en Lima (UTC-5)
    const instant = new Date('2026-07-24T04:30:00.000Z');
    expect(formatDateYmdInTimeZone(instant, 'America/Lima')).toBe('2026-07-23');
    const { start, end, ymd } = dayBoundsInTimeZone(instant, 'America/Lima');
    expect(ymd).toBe('2026-07-23');
    expect(start.toISOString()).toBe('2026-07-23T05:00:00.000Z');
    expect(end.toISOString()).toBe('2026-07-24T05:00:00.000Z');
  });

  it('acepta periodo SUNAT YYYYMM y YYYY-MM', () => {
    expect(parseYearMonth('202609')).toEqual({ year: 2026, month: 9 });
    expect(parseYearMonth('2026-09')).toEqual({ year: 2026, month: 9 });
    const a = monthBoundsInTimeZone('202609', 'America/Lima');
    const b = monthBoundsInTimeZone('2026-09', 'America/Lima');
    expect(a.fromYmd).toBe('2026-09-01');
    expect(a.toYmd).toBe('2026-09-30');
    expect(a.start.toISOString()).toBe(b.start.toISOString());
    expect(() => parseYearMonth('2026')).toThrow(/Invalid yearMonth/);
  });

  it('formatea hora y offset ISO en zona', () => {
    const instant = new Date('2026-07-09T15:00:00.000Z');
    expect(formatHourInTimeZone(instant, 'America/Lima')).toBe('10');
    expect(formatIsoOffsetInTimeZone(instant, 'America/Lima')).toBe(
      '2026-07-09T10:00:00.000-05:00',
    );
  });
});
