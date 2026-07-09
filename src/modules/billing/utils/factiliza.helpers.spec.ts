import {
  buildFactilizaLegend,
  extractBase64Artifact,
  mapFactilizaAfectadoTipo,
  mapFactilizaTipoDoc,
  peruEmissionDate,
  roundMoney,
} from './factiliza.helpers';

describe('factiliza.helpers', () => {
  it('convierte total a letras en español', () => {
    expect(buildFactilizaLegend(10)).toBe('SON DIEZ CON 00/100 SOLES');
    expect(buildFactilizaLegend(125.5)).toContain('SON CIENTO VEINTI');
  });

  it('mapea tipos de documento SUNAT', () => {
    expect(mapFactilizaTipoDoc('FACTURA')).toBe('01');
    expect(mapFactilizaTipoDoc('BOLETA')).toBe('03');
    expect(mapFactilizaTipoDoc('NOTA_CREDITO')).toBe('07');
    expect(mapFactilizaTipoDoc('DESCONOCIDO')).toBe('03');
  });

  it('mapea tipo afectado para NC/ND', () => {
    expect(mapFactilizaAfectadoTipo('FACTURA')).toBe('01');
    expect(mapFactilizaAfectadoTipo('BOLETA')).toBe('03');
  });

  it('formatea fecha de emisión en zona Perú', () => {
    const formatted = peruEmissionDate('2026-07-09T15:00:00.000Z');
    expect(formatted).toMatch(/-05:00$/);
  });

  it('redondea montos a dos decimales', () => {
    expect(roundMoney('10.555')).toBe(10.56);
    expect(roundMoney(3.141)).toBe(3.14);
  });

  it('extrae artefacto base64 de respuesta Factiliza', () => {
    const buffer = extractBase64Artifact({
      data: { base64: Buffer.from('hola').toString('base64') },
    });
    expect(buffer?.toString('utf8')).toBe('hola');
  });

  it('retorna null si no hay artefacto', () => {
    expect(extractBase64Artifact({})).toBeNull();
  });
});
