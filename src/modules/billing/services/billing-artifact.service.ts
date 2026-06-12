import { Inject, Injectable } from '@nestjs/common';
import { FILE_REPOSITORY } from '../../files/domain/file.repository';
import type { IFileRepository } from '../../files/domain/file.repository';
import { LocalDiskFileStorage } from '../../files/infrastructure/local-disk-file.storage';

@Injectable()
export class BillingArtifactService {
  constructor(
    @Inject(FILE_REPOSITORY) private readonly files: IFileRepository,
    private readonly storage: LocalDiskFileStorage,
  ) {}

  async saveText(name: string, mimeType: string, content: string): Promise<string> {
    return this.saveBuffer(name, mimeType, Buffer.from(content, 'utf8'));
  }

  async saveBuffer(name: string, mimeType: string, content: Buffer): Promise<string> {
    const stored = await this.storage.saveRawBuffer(content, name);
    await this.files.create({
      id: stored.id,
      nombreOriginal: name.slice(0, 500),
      mimeType: mimeType.slice(0, 200),
      tamanoBytes: content.length,
      rutaRelativa: stored.rutaRelativa,
      uploadedByUserId: null,
    });
    return stored.id;
  }
}
