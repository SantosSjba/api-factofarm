export const FILE_REPOSITORY = Symbol('FILE_REPOSITORY');

export type ArchivoRow = {
  id: string;
  tenantId: string | null;
  nombreOriginal: string;
  mimeType: string;
  tamanoBytes: number;
  rutaRelativa: string;
};

export interface IFileRepository {
  create(data: {
    id: string;
    nombreOriginal: string;
    mimeType: string;
    tamanoBytes: number;
    rutaRelativa: string;
    uploadedByUserId: string | null;
    tenantId?: string | null;
  }): Promise<ArchivoRow>;
  findById(id: string): Promise<ArchivoRow | null>;
}
