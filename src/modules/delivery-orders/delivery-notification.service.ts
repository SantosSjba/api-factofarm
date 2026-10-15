import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeliveryNotificationChannel,
  DeliveryOrderStatus,
} from '../../generated/prisma/client';
import { EmailService } from '../../common/services/email.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DeliveryNotificationService {
  private readonly logger = new Logger(DeliveryNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly email: EmailService,
  ) {}

  async notifyStatusChange(orderId: string, newStatus: DeliveryOrderStatus) {
    const order = await this.prisma.deliveryOrder.findFirst({
      where: { id: orderId, deletedAt: null },
      select: {
        id: true,
        numero: true,
        estado: true,
        clienteNombre: true,
        clienteTelefono: true,
        clienteEmail: true,
        total: true,
        direccionEntrega: true,
        establishment: {
          select: {
            nombre: true,
            deliveryWhatsappNumero: true,
            deliveryNotifyEmailEnabled: true,
            deliveryNotifySmsEnabled: true,
          },
        },
      },
    });
    if (!order) return;

    const templateKey = `status.${newStatus}`;
    const message = this.buildStatusMessage(
      order.establishment.nombre,
      order.numero,
      newStatus,
    );

    const whatsappPhone = this.normalizePhone(
      order.establishment.deliveryWhatsappNumero ?? order.clienteTelefono,
    );
    const whatsappLink = whatsappPhone
      ? this.buildWhatsAppLink(whatsappPhone, message)
      : null;

    await this.log(
      order.id,
      DeliveryNotificationChannel.WHATSAPP,
      templateKey,
      order.clienteTelefono,
      message,
      true,
    );

    if (
      order.establishment.deliveryNotifyEmailEnabled &&
      order.clienteEmail?.trim()
    ) {
      try {
        await this.email.sendTransactional(
          order.clienteEmail.trim(),
          `Pedido ${order.numero} — ${order.establishment.nombre}`,
          message,
        );
        await this.log(
          order.id,
          DeliveryNotificationChannel.EMAIL,
          templateKey,
          order.clienteEmail,
          message,
          true,
        );
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Error email';
        await this.log(
          order.id,
          DeliveryNotificationChannel.EMAIL,
          templateKey,
          order.clienteEmail,
          message,
          false,
          errMsg,
        );
      }
    }

    if (order.establishment.deliveryNotifySmsEnabled) {
      const smsOk = this.logSmsDev();
      await this.log(
        order.id,
        DeliveryNotificationChannel.SMS,
        templateKey,
        order.clienteTelefono,
        message,
        smsOk,
        smsOk ? undefined : 'SMS no configurado (solo log en desarrollo)',
      );
    }

    return { whatsappLink, message };
  }

  buildWhatsAppLink(phone: string, text: string): string {
    const digits = phone.replace(/\D/g, '');
    const withCountry = digits.startsWith('51') ? digits : `51${digits}`;
    return `https://wa.me/${withCountry}?text=${encodeURIComponent(text)}`;
  }

  private buildStatusMessage(
    farmacia: string,
    numero: string,
    status: DeliveryOrderStatus,
  ): string {
    const labels: Record<DeliveryOrderStatus, string> = {
      RECIBIDO: 'recibimos tu pedido',
      PREPARANDO: 'estamos preparando tu pedido',
      EN_CAMINO: 'tu pedido está en camino',
      ENTREGADO: 'tu pedido fue entregado',
      CANCELADO: 'tu pedido fue cancelado',
    };
    return `Hola, ${farmacia} informa: ${labels[status]} (pedido ${numero}). Gracias por preferirnos.`;
  }

  private normalizePhone(phone: string | null | undefined): string | null {
    if (!phone?.trim()) return null;
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 9 ? digits : null;
  }

  private logSmsDev(): boolean {
    if (this.config.get('NODE_ENV') === 'production') {
      this.logger.warn({
        event: 'sms_skipped',
        reason: 'provider_not_configured',
      });
      return false;
    }
    this.logger.log({ event: 'sms_skipped', reason: 'development_mode' });
    return true;
  }

  private async log(
    deliveryOrderId: string,
    channel: DeliveryNotificationChannel,
    templateKey: string,
    destino: string,
    mensaje: string,
    enviadoOk: boolean,
    errorMessage?: string,
  ) {
    await this.prisma.deliveryNotificationLog.create({
      data: {
        deliveryOrderId,
        channel,
        templateKey,
        destino,
        mensaje: mensaje.slice(0, 1000),
        enviadoOk,
        errorMessage: errorMessage?.slice(0, 500) ?? null,
      },
    });
  }
}
