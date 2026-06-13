import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SensitiveHealthCryptoService {
  private readonly key: Buffer | null;

  constructor(private readonly config: ConfigService) {
    const raw = this.config.get<string>('LPDP_SENSITIVE_ENCRYPTION_KEY')?.trim();
    if (!raw) {
      this.key = null;
      return;
    }
    this.key = createHash('sha256').update(raw).digest();
  }

  isEnabled(): boolean {
    return this.key !== null;
  }

  encrypt(plain: string | null | undefined): string | null {
    if (!plain?.trim() || !this.key) return null;
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  }

  decrypt(cipherText: string | null | undefined): string | null {
    if (!cipherText?.trim() || !this.key) return null;
    const buf = Buffer.from(cipherText, 'base64');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const data = buf.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  }

  hashSignature(payload: string): string {
    return createHash('sha256').update(payload).digest('hex');
  }
}
