import { Injectable } from '@nestjs/common';
import type { Server } from 'socket.io';
import {
  establishmentRoom,
  REALTIME_EVENTS,
  saleRoom,
  type RealtimeEvent,
} from './realtime.events';

@Injectable()
export class RealtimeService {
  private server: Server | null = null;

  bindServer(server: Server) {
    this.server = server;
  }

  emitToEstablishment(establishmentId: string, event: RealtimeEvent, payload: unknown) {
    if (!this.server) return;
    this.server.to(establishmentRoom(establishmentId)).emit(event, payload);
  }

  emitToSale(saleId: string, event: RealtimeEvent, payload: unknown) {
    if (!this.server) return;
    this.server.to(saleRoom(saleId)).emit(event, payload);
  }

  emitStockUpdated(establishmentId: string, warehouseId: string, productId?: string) {
    this.emitToEstablishment(establishmentId, REALTIME_EVENTS.STOCK_UPDATED, {
      warehouseId,
      productId,
      at: new Date().toISOString(),
    });
  }

  emitSaleCompleted(
    establishmentId: string,
    payload: { saleId: string; total: string; documentType: string; serie?: string | null; numero?: string | null },
  ) {
    this.emitToEstablishment(establishmentId, REALTIME_EVENTS.SALE_COMPLETED, payload);
  }

  emitBillingStatus(
    establishmentId: string,
    saleId: string,
    payload: { saleId: string; sunatStatus: string; sunatCodigo?: string | null; sunatDescripcion?: string | null },
  ) {
    this.emitToSale(saleId, REALTIME_EVENTS.BILLING_STATUS, payload);
    this.emitToEstablishment(establishmentId, REALTIME_EVENTS.BILLING_STATUS, payload);
  }
}
