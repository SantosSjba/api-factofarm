import { BillingArtifactService } from './billing-artifact.service';

describe('BillingArtifactService', () => {
  const files = { create: jest.fn().mockResolvedValue(undefined) };
  const storage = {
    saveRawBuffer: jest.fn().mockResolvedValue({ id: 'file-1', rutaRelativa: 'billing/x.xml' }),
  };
  const service = new BillingArtifactService(files as never, storage as never);

  beforeEach(() => jest.clearAllMocks());

  it('guarda texto como buffer y registra archivo', async () => {
    const id = await service.saveText('doc.xml', 'application/xml', '<Invoice/>');
    expect(id).toBe('file-1');
    expect(storage.saveRawBuffer).toHaveBeenCalled();
    expect(files.create).toHaveBeenCalledWith(
      expect.objectContaining({ mimeType: 'application/xml' }),
    );
  });

  it('guarda buffer binario', async () => {
    const id = await service.saveBuffer('doc.pdf', 'application/pdf', Buffer.from('pdf'));
    expect(id).toBe('file-1');
  });
});
