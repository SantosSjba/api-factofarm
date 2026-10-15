import { LegalService } from './legal.service';

describe('LegalService', () => {
  const service = new LegalService({
    get: (key: string) => {
      if (key === 'COMPANY_LEGAL_NAME')
        return Promise.resolve('Botica Demo SAC');
      if (key === 'COMPANY_RUC') return Promise.resolve('20123456789');
      if (key === 'COMPANY_ADDRESS') return Promise.resolve('Lima');
      return undefined;
    },
  } as never);

  it('expone política de privacidad', () => {
    const doc = service.getPrivacyPolicy();
    expect(doc.title).toContain('privacidad');
    expect(doc.content.length).toBeGreaterThan(0);
  });

  it('expone libro de reclamaciones con datos del proveedor', async () => {
    const doc = await service.getComplaintsBook();
    expect(doc.provider.ruc).toBe('20123456789');
    expect(doc.responseDeadlineDays).toBe(15);
  });
});
