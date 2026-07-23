import { LpdpService, LPDP_CONSENT_VERSION } from './lpdp.service';

describe('LpdpService', () => {
  const crypto = { isEnabled: jest.fn().mockReturnValue(true) };
  const service = new LpdpService(
    {} as never,
    { log: jest.fn() } as never,
    crypto as never,
    {} as never,
  );

  it('expone matriz de tratamiento y versión de consentimiento', () => {
    const matrix = service.getTreatmentMatrix();
    expect(matrix.version).toBe(LPDP_CONSENT_VERSION);
    expect(matrix.encryptionEnabled).toBe(true);
    expect(matrix.rows.length).toBeGreaterThan(0);
  });
});
