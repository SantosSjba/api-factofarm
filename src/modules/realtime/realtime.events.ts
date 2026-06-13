export const REALTIME_EVENTS = {
  STOCK_UPDATED: 'stock.updated',
  SALE_COMPLETED: 'sale.completed',
  BILLING_STATUS: 'billing.status',
} as const;

export type RealtimeEvent = (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];

export function establishmentRoom(establishmentId: string): string {
  return `establishment:${establishmentId}`;
}

export function saleRoom(saleId: string): string {
  return `sale:${saleId}`;
}
