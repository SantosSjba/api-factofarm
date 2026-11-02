/** Emparejamiento apertura ↔ cierre de caja de BoticaJL (compartido por migrate y repair). */
type Row = Record<string, string | null>;

const ENTITIES: Record<string, string> = {
  '&ntilde;': 'ñ', '&Ntilde;': 'Ñ', '&aacute;': 'á', '&eacute;': 'é', '&iacute;': 'í',
  '&oacute;': 'ó', '&uacute;': 'ú', '&amp;': '&', '&quot;': '"', '&#39;': "'",
};
export const clean = (v: string | null | undefined) =>
  (v ?? '').trim().replace(/&[a-zA-Z]+;|&#\d+;/g, (e) => ENTITIES[e] ?? e);

/** Fecha/hora local de Lima (UTC-5, sin horario de verano) → Date UTC. */
export const lima = (date: string, time = '00:00:00') => new Date(`${date}T${time}-05:00`);

/** "8:31-am" / "9:52-pm" → "08:31:00". */
export function parseHora(h: string): string {
  const m = /^(\d{1,2}):(\d{2})\s*-?\s*(am|pm)?/i.exec(clean(h));
  if (!m) return '00:00:00';
  let hh = Number(m[1]);
  const ap = (m[3] ?? '').toLowerCase();
  if (ap === 'pm' && hh < 12) hh += 12;
  if (ap === 'am' && hh === 12) hh = 0;
  return `${String(hh).padStart(2, '0')}:${m[2]}:00`;
}

export type MatchedSession = {
  apertura: Row;
  user: string;
  openedAt: Date;
  cierre?: Row;
  closedAt: Date;
};

/**
 * Cada cierre se asigna a la apertura más reciente del mismo usuario y caja abierta antes del cierre
 * (y aún sin cierre). Las aperturas sin cierre se cierran al abrirse la siguiente caja o al final del día.
 */
export function matchCashSessions(aperturas: Row[], cierres: Row[], now: Date): MatchedSession[] {
  const sessions: MatchedSession[] = [...aperturas]
    .sort((a, b) => Number(a.idcaja_a) - Number(b.idcaja_a))
    .map((a) => {
      const openedAt = lima(clean(a.fecha), parseHora(clean(a.hora)));
      return { apertura: a, user: clean(a.usuario).toLowerCase(), openedAt, closedAt: openedAt };
    });
  const key = (r: Row) => `${clean(r.caja).toLowerCase()}|${clean(r.usuario).toLowerCase()}`;
  const sortedCierres = [...cierres]
    .map((c) => ({ c, at: lima(clean(c.fecha), parseHora(clean(c.hora))) }))
    .sort((x, y) => x.at.getTime() - y.at.getTime() || Number(x.c.idcaja_c) - Number(y.c.idcaja_c));
  for (const { c, at } of sortedCierres) {
    const cand = sessions
      .filter((s) => !s.cierre && key(s.apertura) === key(c) && s.openedAt <= at)
      .sort((x, y) => y.openedAt.getTime() - x.openedAt.getTime())[0];
    if (cand) {
      cand.cierre = c;
      cand.closedAt = at;
    }
  }
  const byOpen = [...sessions].sort((x, y) => x.openedAt.getTime() - y.openedAt.getTime());
  for (const s of sessions) {
    if (s.cierre) continue;
    const next = byOpen.find((o) => o.openedAt > s.openedAt);
    const endOfDay = lima(clean(s.apertura.fecha), '23:59:00');
    const limit = next ? new Date(Math.min(next.openedAt.getTime() - 60_000, endOfDay.getTime())) : now;
    s.closedAt = new Date(Math.max(s.openedAt.getTime(), limit.getTime()));
  }
  return sessions;
}

/** Sesión para una venta: la del vendedor cuyo intervalo la contiene; si no, cualquiera que la contenga; si no, la del día. */
export function pickSessionIndex(
  sessions: { userId: string; openedAt: Date; closedAt: Date; date: string }[],
  date: string,
  userId: string,
  at: Date,
): number {
  const idx = sessions.map((s, i) => ({ s, i }));
  const inside = idx.filter(({ s }) => s.openedAt <= at && at <= s.closedAt);
  const pick = (l: typeof idx) => (l.length ? l.sort((a, b) => b.s.openedAt.getTime() - a.s.openedAt.getTime())[0].i : -1);
  const own = inside.filter(({ s }) => s.userId === userId);
  if (own.length) return pick(own);
  if (inside.length) return pick(inside);
  const sameDay = idx.filter(({ s }) => s.date === date);
  const ownDay = sameDay.filter(({ s }) => s.userId === userId && s.openedAt <= at);
  if (ownDay.length) return pick(ownDay);
  const dayBefore = sameDay.filter(({ s }) => s.openedAt <= at);
  if (dayBefore.length) return pick(dayBefore);
  return sameDay.length ? sameDay[0].i : -1;
}
