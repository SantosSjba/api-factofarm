import { encodeCursor, decodeCursor, buildCursorPaginatedResult } from './cursor-pagination.dto';

describe('cursor-pagination', () => {
  it('encode/decode cursor roundtrip', () => {
    const createdAt = new Date('2026-06-12T10:00:00.000Z');
    const id = 'abc-123';
    const cursor = encodeCursor(createdAt, id);
    expect(decodeCursor(cursor)).toEqual({ createdAt, id });
  });

  it('buildCursorPaginatedResult indica nextCursor cuando hay más filas', () => {
    const rows = [
      { id: '2', createdAt: new Date('2026-06-12T09:00:00.000Z') },
      { id: '1', createdAt: new Date('2026-06-12T08:00:00.000Z') },
      { id: '0', createdAt: new Date('2026-06-12T07:00:00.000Z') },
    ];
    const page = buildCursorPaginatedResult(rows, 2, (r) => encodeCursor(r.createdAt, r.id));
    expect(page.items).toHaveLength(2);
    expect(page.nextCursor).toBeTruthy();
  });
});
