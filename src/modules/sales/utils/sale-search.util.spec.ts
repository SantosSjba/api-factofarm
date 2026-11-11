import { parseDocumentNumber, saleSearchFilter } from './sale-search.util';

describe('parseDocumentNumber', () => {
  it('separa serie y número con o sin ceros', () => {
    expect(parseDocumentNumber('b001-25')).toEqual({ serie: 'B001', numero: '25' });
    expect(parseDocumentNumber('B001-00000025')).toEqual({ serie: 'B001', numero: '25' });
    expect(parseDocumentNumber('NV01 - 7')).toEqual({ serie: 'NV01', numero: '7' });
  });

  it('acepta solo número o solo serie', () => {
    expect(parseDocumentNumber('00042')).toEqual({ numero: '42' });
    expect(parseDocumentNumber('F001')).toEqual({ serie: 'F001' });
  });

  it('no confunde un nombre con un comprobante', () => {
    expect(parseDocumentNumber('Juan Pérez')).toBeNull();
  });
});

describe('saleSearchFilter', () => {
  it('busca el número exacto con y sin relleno', () => {
    const or = saleSearchFilter('B001-25');
    expect(or).toContainEqual({ serie: 'B001', numero: { in: ['25', '00000025'] } });
  });
});
