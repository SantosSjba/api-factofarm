import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import type { UserRole } from '../../generated/prisma/client';

export type AuthUserView = {
  id: string;
  nombre: string;
  email: string;
  role: UserRole;
  establecimientoId: string;
};

type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string): Promise<{
    accessToken: string;
    user: AuthUserView;
  }> {
    const user = await this.prisma.user.findFirst({
      where: {
        email: { equals: email.trim(), mode: 'insensitive' },
        deletedAt: null,
      },
    });
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role: user.role,
        establecimientoId: user.establecimientoId,
      },
    };
  }
}
