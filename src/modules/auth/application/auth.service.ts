import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { resolveUserPermissionCodes } from '../../../common/tenants/tenant-permissions.util';
import { expandUserPermissionCodes } from '../../../common/permissions/nav-permission-expansion';
import { getDefaultNavCodesForRole } from '../../../common/permissions/role-permission-templates';
import { isPlatformAdmin } from '../../../common/permissions/role-policy.util';
import { AuditLogService } from '../../../common/services/audit-log.service';
import { EmailService } from '../../../common/services/email.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserRole, TenantStatus, TenantPlan } from '../../../generated/prisma/client';
import { validatePasswordPolicy } from '../../../common/validators/password-policy';
import { LoginAttemptService } from './login-attempt.service';
import type {
  AuthTokensView,
  AuthUserView,
  AuthJwtPayload,
  JwtRequestUser,
  PanelHandoffCreateView,
} from '../domain/auth.types';
import type { UpdateMeDto } from './dto/update-me.dto';

const BCRYPT_ROUNDS = 10;
const PANEL_HANDOFF_TTL_SECONDS = 60;
const SUPPORT_ACCESS_EXPIRES = '2h';

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

  async me(actor: JwtRequestUser): Promise<AuthUserView> {
    if (actor.supportSession && actor.tenantId) {
      const tenant = await this.prisma.tenant.findFirst({
        where: { id: actor.tenantId, deletedAt: null },
        select: { nombre: true, status: true },
      });
      return {
        id: actor.sub,
        nombre: 'Soporte FactoSys',
        email: actor.email,
        role: actor.role,
        tenantId: actor.tenantId,
        tenantNombre: tenant?.nombre ?? null,
        tenantStatus: tenant?.status ?? null,
        establecimientoId: actor.establecimientoId,
        permissionCodes: actor.permissionCodes ?? [],
        supportSession: true,
        logoUrl: await this.logoUrlForEstablishment(actor.establecimientoId),
      };
    }

    const user = await this.prisma.user.findFirst({
      where: { id: actor.sub, deletedAt: null },
      include: {
        permissions: { include: { permission: true } },
        tenant: { select: authTenantSelect },
      },
    });
    if (!user) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Usuario no encontrado' });
    }
    return this.toAuthUserView(user, await this.logoUrlForEstablishment(user.establecimientoId));
  }

  /**
   * SUPER_ADMIN crea un código de un solo uso para abrir el panel de un tenant en otra pestaña.
   */
  async createTenantPanelHandoff(
    actor: JwtRequestUser,
    tenantId: string,
  ): Promise<PanelHandoffCreateView> {
    if (!isPlatformAdmin(actor.role) || actor.supportSession) {
      throw new ForbiddenException('Solo operadores de plataforma FactoSys pueden entrar al panel de un cliente');
    }

    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null },
      select: {
        id: true,
        nombre: true,
        status: true,
        plan: true,
        enabledModules: true,
      },
    });
    if (!tenant) throw new NotFoundException('Cliente SaaS no encontrado');
    if (tenant.status === TenantStatus.SUSPENDED) {
      throw new BadRequestException('No se puede ingresar a un cliente suspendido');
    }
    if (tenant.status === TenantStatus.PENDING) {
      throw new BadRequestException('El cliente aún no está activo; aprovisione y active primero');
    }

    const establishment = await this.prisma.establishment.findFirst({
      where: { tenantId: tenant.id, deletedAt: null, activo: true },
      orderBy: [{ codigo: 'asc' }, { createdAt: 'asc' }],
      select: { id: true },
    });
    if (!establishment) {
      throw new BadRequestException('El cliente no tiene establecimientos activos. Aprovisione primero.');
    }

    const plainCode = randomBytes(32).toString('hex');
    const codeHash = this.hashToken(plainCode);
    const expiresAt = new Date(Date.now() + PANEL_HANDOFF_TTL_SECONDS * 1000);

    await this.prisma.platformPanelHandoff.create({
      data: {
        codeHash,
        actorUserId: actor.sub,
        tenantId: tenant.id,
        establishmentId: establishment.id,
        expiresAt,
      },
    });

    await this.audit.log({
      userId: actor.sub,
      action: 'TENANT_PANEL_HANDOFF',
      entity: 'Tenant',
      entityId: tenant.id,
      diff: { establishmentId: establishment.id },
    });

    return {
      exchangeCode: plainCode,
      tenantId: tenant.id,
      tenantNombre: tenant.nombre,
      expiresInSeconds: PANEL_HANDOFF_TTL_SECONDS,
    };
  }

  /** Canje público del código → sesión tenant (ADMINISTRADOR / ADMIN_CADENA de soporte). */
  async exchangePanelHandoff(code: string): Promise<AuthTokensView> {
    const normalized = code?.trim();
    if (!normalized) {
      throw new BadRequestException('Código de acceso requerido');
    }
    const codeHash = this.hashToken(normalized);
    const handoff = await this.prisma.platformPanelHandoff.findUnique({
      where: { codeHash },
    });
    if (!handoff || handoff.usedAt || handoff.expiresAt < new Date()) {
      throw new UnauthorizedException({
        code: 'INVALID_HANDOFF',
        message: 'El enlace de acceso expiró o ya fue usado. Genere uno nuevo desde plataforma.',
      });
    }

    await this.prisma.platformPanelHandoff.update({
      where: { id: handoff.id },
      data: { usedAt: new Date() },
    });

    const [actor, tenant] = await Promise.all([
      this.prisma.user.findFirst({
        where: { id: handoff.actorUserId, deletedAt: null },
        select: { id: true, email: true, nombre: true, role: true },
      }),
      this.prisma.tenant.findFirst({
        where: { id: handoff.tenantId, deletedAt: null },
        select: authTenantSelect,
      }),
    ]);

    if (!actor || !isPlatformAdmin(actor.role)) {
      throw new UnauthorizedException('Operador de plataforma no válido');
    }
    if (!tenant || tenant.status === TenantStatus.SUSPENDED) {
      throw new UnauthorizedException('Cliente no disponible');
    }

    const supportRole =
      tenant.plan === TenantPlan.CADENA ? UserRole.ADMIN_CADENA : UserRole.ADMINISTRADOR;
    const permissionCodes = resolveUserPermissionCodes({
      role: supportRole,
      permissionCodes: expandUserPermissionCodes(
        getDefaultNavCodesForRole(supportRole),
        supportRole,
      ),
      tenant,
    });

    const tokens = await this.issueSupportTokens({
      actorId: actor.id,
      email: actor.email,
      nombre: actor.nombre,
      role: supportRole,
      tenantId: tenant.id,
      establecimientoId: handoff.establishmentId,
      permissionCodes,
      tenantNombre: tenant.nombre,
      tenantStatus: tenant.status,
    });

    await this.audit.log({
      userId: actor.id,
      tenantId: tenant.id,
      action: 'TENANT_PANEL_ENTER',
      entity: 'Tenant',
      entityId: tenant.id,
      diff: { supportRole, establishmentId: handoff.establishmentId },
    });

    return tokens;
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

    const refreshed = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        permissions: { include: { permission: true } },
        tenant: { select: authTenantSelect },
      },
    });
    if (!refreshed) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Usuario no encontrado' });
    }
    return this.toAuthUserView(
      refreshed,
      await this.logoUrlForEstablishment(refreshed.establecimientoId),
    );
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
      user: this.toAuthUserView(
        user,
        await this.logoUrlForEstablishment(user.establecimientoId),
      ),
    };
  }

  private async issueSupportTokens(input: {
    actorId: string;
    email: string;
    nombre: string;
    role: UserRole;
    tenantId: string;
    establecimientoId: string;
    permissionCodes: string[];
    tenantNombre: string;
    tenantStatus: string;
  }): Promise<AuthTokensView> {
    const payload: AuthJwtPayload = {
      sub: input.actorId,
      email: input.email,
      role: input.role,
      tenantId: input.tenantId,
      establecimientoId: input.establecimientoId,
      permissionCodes: input.permissionCodes,
      supportSession: true,
    };

    const accessToken = await this.jwtService.signAsync(
      payload as Record<string, unknown>,
      { expiresIn: SUPPORT_ACCESS_EXPIRES },
    );

    const refreshPlain = randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(refreshPlain);
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: { userId: input.actorId, tokenHash, expiresAt },
    });

    return {
      accessToken,
      refreshToken: refreshPlain,
      user: {
        id: input.actorId,
        nombre: `${input.nombre} (soporte)`,
        email: input.email,
        role: input.role,
        tenantId: input.tenantId,
        tenantNombre: input.tenantNombre,
        tenantStatus: input.tenantStatus,
        establecimientoId: input.establecimientoId,
        permissionCodes: input.permissionCodes,
        supportSession: true,
        logoUrl: await this.logoUrlForEstablishment(input.establecimientoId),
      },
    };
  }

  private async logoUrlForEstablishment(
    establecimientoId: string | null | undefined,
  ): Promise<string | null> {
    if (!establecimientoId) return null;
    const row = await this.prisma.establishment.findFirst({
      where: { id: establecimientoId, deletedAt: null },
      select: { logoArchivoId: true },
    });
    return row?.logoArchivoId ? `/api/v1/files/${row.logoArchivoId}` : null;
  }

  private toAuthUserView(
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
    logoUrl: string | null = null,
  ): AuthUserView {
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
      logoUrl,
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
