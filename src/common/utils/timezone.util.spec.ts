import {
  DEFAULT_TIME_ZONE,
  dayBoundsInTimeZone,
  formatDateYmdInTimeZone,
  formatHourInTimeZone,
  formatIsoOffsetInTimeZone,
  isValidTimeZone,
  normalizeTimeZone,
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

  it('formatea hora y offset ISO en zona', () => {
    const instant = new Date('2026-07-09T15:00:00.000Z');
    expect(formatHourInTimeZone(instant, 'America/Lima')).toBe('10');
    expect(formatIsoOffsetInTimeZone(instant, 'America/Lima')).toBe(
      '2026-07-09T10:00:00.000-05:00',
    );
  });
});
