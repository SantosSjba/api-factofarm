import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;

@Injectable()
export class LoginAttemptService {
  constructor(private readonly prisma: PrismaService) {}

  async assertNotLocked(email: string, ipAddress?: string): Promise<void> {
    const since = new Date(Date.now() - WINDOW_MS);
    const normalized = email.trim().toLowerCase();

    const emailFailures = await this.prisma.loginAttempt.count({
      where: {
        email: normalized,
        success: false,
        createdAt: { gte: since },
      },
    });

    if (emailFailures >= MAX_ATTEMPTS) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_LOCKED',
        message: `Demasiados intentos fallidos. Intente de nuevo en ${LOCKOUT_MS / 60000} minutos.`,
      });
    }

    // Throttle adicional por IP (ataques distribuidos sobre muchos emails).
    if (ipAddress?.trim()) {
      const ipFailures = await this.prisma.loginAttempt.count({
        where: {
          ipAddress: ipAddress.trim(),
          success: false,
          createdAt: { gte: since },
        },
      });
      if (ipFailures >= MAX_ATTEMPTS) {
        throw new UnauthorizedException({
          code: 'IP_LOCKED',
          message: `Demasiados intentos fallidos desde esta red. Intente de nuevo en ${LOCKOUT_MS / 60000} minutos.`,
        });
      }
    }
  }

  async recordAttempt(
    email: string,
    success: boolean,
    ipAddress?: string,
  ): Promise<void> {
    await this.prisma.loginAttempt.create({
      data: {
        email: email.trim().toLowerCase(),
        success,
        ipAddress: ipAddress ?? null,
      },
    });
  }
}
