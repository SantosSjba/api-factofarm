import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { hasChainScope, isPlatformAdmin } from '../../common/permissions/role-policy.util';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthJwtPayload } from '../auth/domain/auth.types';
import { establishmentRoom, saleRoom } from './realtime.events';
import { RealtimeService } from './realtime.service';

@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: true, credentials: true },
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly realtime: RealtimeService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    this.realtime.bindServer(server);
    this.logger.log('Realtime gateway listo (namespace /realtime)');
  }

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.disconnect(true);
        return;
      }
      const payload = this.jwt.verify<AuthJwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
      await client.join(establishmentRoom(payload.establecimientoId));
      client.data.user = payload;
      client.on('join-sale', (saleId: string) => {
        void this.handleJoinSale(client, payload, saleId);
      });
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user as AuthJwtPayload | undefined;
    if (user) {
      this.logger.debug(`Cliente WS desconectado: ${user.email}`);
    }
  }

  private async handleJoinSale(
    client: Socket,
    actor: AuthJwtPayload,
    saleId: string,
  ): Promise<void> {
    if (typeof saleId !== 'string' || !saleId.trim()) return;
    const id = saleId.trim();
    const sale = await this.prisma.sale.findFirst({
      where: { id, deletedAt: null },
      select: {
        establishmentId: true,
        establishment: { select: { tenantId: true } },
      },
    });
    if (!sale) return;

    if (!isPlatformAdmin(actor.role)) {
      if (!actor.tenantId || sale.establishment.tenantId !== actor.tenantId) {
        return;
      }
      if (!hasChainScope(actor.role) && sale.establishmentId !== actor.establecimientoId) {
        return;
      }
    }

    await client.join(saleRoom(id));
  }

  private extractToken(client: Socket): string | null {
    const auth = client.handshake.auth as { token?: string } | undefined;
    if (auth?.token?.trim()) return auth.token.trim();
    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7).trim();
    }
    return null;
  }
}
