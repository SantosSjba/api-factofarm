import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { resolveUserPermissionCodes } from '../../../common/tenants/tenant-permissions.util';
import { AuditLogService } from '../../../common/services/audit-log.service';
import { EmailService } from '../../../common/services/email.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserRole, TenantStatus, TenantPlan } from '../../../generated/prisma/client';
import { validatePasswordPolicy } from '../../../common/validators/password-policy';
import { LoginAttemptService } from './login-attempt.service';
import type { AuthTokensView, AuthUserView, AuthJwtPayload } from '../domain/auth.types';
import type { UpdateMeDto } from './dto/update-me.dto';

const BCRYPT_ROUNDS = 10;

const authTenantSelect = {
  id: true,
  nombre: true,
  status: true,
  plan: true,
  enabledModules: true,
} as const;

type AuthTenantSnapshot = {
  id: string;
  nombre: string;
  status: string;
  plan: TenantPlan;
  enabledModules: unknown;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly loginAttempts: LoginAttemptService,
    private readonly email: EmailService,
    private readonly audit: AuditLogService,
  ) {}

  async login(
    email: string,
    password: string,
    ipAddress?: string,
  ): Promise<AuthTokensView> {
    const normalized = email.trim().toLowerCase();
    await this.loginAttempts.assertNotLocked(normalized, ipAddress);

    const user = await this.prisma.user.findFirst({
      where: { email: { equals: normalized, mode: 'insensitive' }, deletedAt: null },
      include: {
        permissions: { include: { permission: true } },
        tenant: { select: authTenantSelect },
      },
    });

    if (!user) {
      await this.loginAttempts.recordAttempt(normalized, false, ipAddress);
      await this.audit.log({
        action: 'LOGIN_FAILED',
        entity: 'Auth',
        diff: { email: normalized, reason: 'USER_NOT_FOUND' },
        ipAddress,
      });
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Credenciales inválidas',
      });
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      await this.loginAttempts.recordAttempt(normalized, false, ipAddress);
      await this.audit.log({
        userId: user.id,
        action: 'LOGIN_FAILED',
        entity: 'Auth',
        entityId: user.id,
        diff: { email: normalized, reason: 'BAD_PASSWORD' },
        ipAddress,
      });
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Credenciales inválidas',
      });
    }

    await this.assertTenantAccessAllowed(user);

    await this.loginAttempts.recordAttempt(normalized, true, ipAddress);
    await this.audit.log({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entity: 'Auth',
      entityId: user.id,
      ipAddress,
    });
    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthTokensView> {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            permissions: { include: { permission: true } },
            tenant: { select: authTenantSelect },
          },
        },
      },
    });

    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt < new Date() ||
      stored.user.deletedAt
    ) {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Sesión expirada; inicie sesión nuevamente',
      });
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    await this.assertTenantAccessAllowed(stored.user);

    return this.issueTokens(stored.user);
  }

  private async assertTenantAccessAllowed(user: {
    role: UserRole;
    tenantId: string | null;
  }): Promise<void> {
    if (user.role === UserRole.SUPER_ADMIN || !user.tenantId) {
      return;
    }
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: user.tenantId, deletedAt: null },
      select: { status: true },
    });
    if (!tenant) {
      throw new UnauthorizedException({
        code: 'TENANT_NOT_FOUND',
        message: 'Cliente no encontrado o inactivo',
      });
    }
    if (tenant.status === TenantStatus.SUSPENDED) {
      throw new UnauthorizedException({
        code: 'TENANT_SUSPENDED',
        message: 'La cuenta de su farmacia está suspendida. Contacte a FactoFarm.',
      });
    }
  }

  async logout(refreshToken: string): Promise<{ ok: true }> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  async me(userId: string): Promise<AuthUserView> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        permissions: { include: { permission: true } },
        tenant: { select: authTenantSelect },
      },
    });
    if (!user) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Usuario no encontrado' });
    }
    return this.toAuthUserView(user);
  }

  async updateMe(userId: string, dto: UpdateMeDto): Promise<AuthUserView> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Usuario no encontrado' });
    }

    if (dto.email && dto.email.toLowerCase().trim() !== user.email) {
      const taken = await this.prisma.user.findFirst({
        where: {
          email: { equals: dto.email.trim(), mode: 'insensitive' },
          deletedAt: null,
          NOT: { id: userId },
        },
      });
      if (taken) {
        throw new BadRequestException({
          code: 'EMAIL_TAKEN',
          message: 'El correo ya está registrado',
        });
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.nombre !== undefined ? { nombre: dto.nombre.trim() } : {}),
        ...(dto.email !== undefined ? { email: dto.email.toLowerCase().trim() } : {}),
      },
    });

    return this.me(userId);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ ok: true }> {
    const policy = validatePasswordPolicy(newPassword);
    if (!policy.valid) {
      throw new BadRequestException({
        code: 'WEAK_PASSWORD',
        message: 'Contraseña no cumple la política de seguridad',
        details: policy.errors,
      });
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Usuario no encontrado' });
    }

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException({
        code: 'INVALID_PASSWORD',
        message: 'Contraseña actual incorrecta',
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { ok: true };
  }

  async forgotPassword(email: string): Promise<{ ok: true }> {
    const normalized = email.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: normalized, mode: 'insensitive' }, deletedAt: null },
    });
    if (!user) {
      return { ok: true };
    }

    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const plain = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(plain);
    const minutes = Number(this.config.get<string>('PASSWORD_RESET_EXPIRES_MINUTES', '60'));
    const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:4200');
    const resetUrl = `${frontendUrl.replace(/\/$/, '')}/auth/reset-password?token=${plain}`;
    await this.email.sendPasswordReset(user.email, resetUrl);
    return { ok: true };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ ok: true }> {
    const policy = validatePasswordPolicy(newPassword);
    if (!policy.valid) {
      throw new BadRequestException({
        code: 'WEAK_PASSWORD',
        message: 'Contraseña no cumple la política de seguridad',
        details: policy.errors,
      });
    }

    const tokenHash = this.hashToken(token.trim());
    const stored = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !stored ||
      stored.usedAt ||
      stored.expiresAt < new Date() ||
      stored.user.deletedAt
    ) {
      throw new BadRequestException({
        code: 'INVALID_RESET_TOKEN',
        message: 'Enlace inválido o expirado',
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: stored.userId },
        data: { passwordHash },
      });
      await tx.passwordResetToken.update({
        where: { id: stored.id },
        data: { usedAt: new Date() },
      });
      await tx.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    return { ok: true };
  }

  private async issueTokens(
    user: {
      id: string;
      nombre: string;
      email: string;
      role: AuthUserView['role'];
      tenantId: string | null;
      establecimientoId: string;
      tenant?: AuthTenantSnapshot | null;
      permissions: { permission: { code: string } }[];
    },
  ): Promise<AuthTokensView> {
    const permissionCodes = this.resolvePermissionCodes(user);
    const payload: AuthJwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      establecimientoId: user.establecimientoId,
      permissionCodes,
    };

    const accessExpiresIn =
      this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ??
      this.config.get<string>('JWT_EXPIRES_IN') ??
      '15m';
    const accessToken = await this.jwtService.signAsync(
      payload as Record<string, unknown>,
      { expiresIn: accessExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}` },
    );

    const refreshPlain = randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(refreshPlain);
    const refreshDays = Number(this.config.get<string>('JWT_REFRESH_EXPIRES_DAYS', '7'));
    const expiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    return {
      accessToken,
      refreshToken: refreshPlain,
      user: this.toAuthUserView(user),
    };
  }

  private toAuthUserView(user: {
    id: string;
    nombre: string;
    email: string;
    role: AuthUserView['role'];
    tenantId: string | null;
    establecimientoId: string;
    tenant?: AuthTenantSnapshot | null;
    permissions: { permission: { code: string } }[];
  }): AuthUserView {
    return {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      tenantNombre: user.tenant?.nombre ?? null,
      tenantStatus: user.tenant?.status ?? null,
      establecimientoId: user.establecimientoId,
      permissionCodes: this.resolvePermissionCodes(user),
    };
  }

  private resolvePermissionCodes(user: {
    role: UserRole;
    permissions: { permission: { code: string } }[];
    tenant?: AuthTenantSnapshot | null;
  }): string[] {
    const raw = user.permissions.map((p) => p.permission.code);
    return resolveUserPermissionCodes({
      role: user.role,
      permissionCodes: raw,
      tenant: user.tenant ?? null,
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
