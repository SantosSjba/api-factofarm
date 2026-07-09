import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Express } from 'express';
import { actorFromJwt, assertTenantAccess } from '../../../common/scoping/tenant-scope.util';
import { isPlatformAdmin } from '../../../common/permissions/role-policy.util';
import type { JwtRequestUser } from '../../auth/domain/auth.types';
import { FILE_REPOSITORY } from '../domain/file.repository';
import type { IFileRepository } from '../domain/file.repository';
import { LocalDiskFileStorage } from '../infrastructure/local-disk-file.storage';

const MAX_BYTES = 10 * 1024 * 1024;

@Injectable()
export class FilesService {
  constructor(
    @Inject(FILE_REPOSITORY) private readonly files: IFileRepository,
    private readonly storage: LocalDiskFileStorage,
  ) {}

  async saveUploaded(
    file: Express.Multer.File,
    actor: JwtRequestUser,
  ): Promise<{
    id: string;
    nombreOriginal: string;
    mimeType: string;
    tamanoBytes: number;
    url: string;
  }> {
    if (!file.buffer?.length) {
      throw new BadRequestException('Archivo vacío');
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('El archivo supera el tamaño máximo permitido');
    }

    const stored = await this.storage.saveBuffer(file);

    const row = await this.files.create({
      id: stored.id,
      nombreOriginal: file.originalname.slice(0, 500),
      mimeType: (file.mimetype || 'application/octet-stream').slice(0, 200),
      tamanoBytes: file.size,
      rutaRelativa: stored.rutaRelativa,
      uploadedByUserId: actor.sub,
      tenantId: actor.tenantId ?? null,
    });

    return {
      id: row.id,
      nombreOriginal: row.nombreOriginal,
      mimeType: row.mimeType,
      tamanoBytes: row.tamanoBytes,
      url: `/api/v1/files/${row.id}`,
    };
  }

  async getForStream(id: string, actor: JwtRequestUser): Promise<{
    absPath: string;
    mimeType: string;
    nombreOriginal: string;
  }> {
    const row = await this.files.findById(id);
    if (row) {
      this.assertFileTenantAccess(actor, row.tenantId);
    }
    if (!row || !this.storage.exists(row.rutaRelativa)) {
      throw new NotFoundException('Archivo no encontrado');
    }
    return {
      absPath: this.storage.resolveAbsolutePath(row.rutaRelativa),
      mimeType: row.mimeType,
      nombreOriginal: row.nombreOriginal,
    };
  }

  async createReadStreamForId(id: string, actor: JwtRequestUser) {
    const row = await this.files.findById(id);
    if (row) {
      this.assertFileTenantAccess(actor, row.tenantId);
    }
    if (!row || !this.storage.exists(row.rutaRelativa)) {
      throw new NotFoundException('Archivo no encontrado');
    }
    return {
      stream: this.storage.createReadStream(row.rutaRelativa),
      mimeType: row.mimeType,
      nombreOriginal: row.nombreOriginal,
    };
  }

  private assertFileTenantAccess(actor: JwtRequestUser, fileTenantId: string | null): void {
    if (!fileTenantId) {
      if (isPlatformAdmin(actor.role)) {
        return;
      }
      throw new ForbiddenException('Archivo sin tenant asignado');
    }
    assertTenantAccess(actorFromJwt(actor), fileTenantId);
  }
}
