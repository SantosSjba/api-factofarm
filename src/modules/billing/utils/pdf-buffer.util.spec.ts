import { isValidPdfBuffer } from './pdf-buffer.util';

describe('isValidPdfBuffer', () => {
  it('acepta magic %PDF', () => {
    expect(isValidPdfBuffer(Buffer.from('%PDF-1.4\n...'))).toBe(true);
  });

  it('rechaza placeholders de texto', () => {
    expect(isValidPdfBuffer(Buffer.from('Factiliza pdf no disponible'))).toBe(false);
    expect(isValidPdfBuffer(Buffer.alloc(0))).toBe(false);
    expect(isValidPdfBuffer(null)).toBe(false);
  });
});
