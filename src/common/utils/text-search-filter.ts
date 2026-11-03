const SEPARATORS = /[\s\-_.,/]+/;

/** Parte el texto en palabras: separa por espacios/guiones y entre números y letras ("3gel" → 3, gel). */
export function searchParts(search: string): string[] {
  return search
    .trim()
    .replace(/(\d)(\p{L})/gu, '$1 $2')
    .replace(/(\p{L})(\d)/gu, '$1 $2')
    .split(SEPARATORS)
    .filter(Boolean);
}

/**
 * Filtro de búsqueda tolerante a separadores: "tres gel", "3 gel" o "3gel"
 * encuentran "3-GEL". Prisma traduce `contains` a ILIKE '%…%' sin escapar
 * comodines, así que unimos las partes con `%` y escapamos los del usuario.
 */
export function textSearchFilter(search: string) {
  const parts = searchParts(search);
  const contains = (parts.length ? parts : [search.trim()])
    .map((part) => part.replace(/[\\%_]/g, '\\$&'))
    .join('%');
  return { contains, mode: 'insensitive' as const };
}
