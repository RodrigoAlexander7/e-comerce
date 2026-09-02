import { Injectable } from '@nestjs/common';
import { StoreSettingsRepository } from '../../settings/domain/repositories/store-settings.repository.js';
import { OrderNotifier } from '../../checkout/application/ports/order-notifier.port.js';
import type { Order } from '../../checkout/domain/entities/order.entity.js';
import { EmailSender } from '../domain/ports/email-sender.port.js';
import { renderOrderPendingPayment } from '../infrastructure/templates/order-pending-payment.template.js';
import { renderOrderPaymentConfirmed } from '../infrastructure/templates/order-payment-confirmed.template.js';

/**
 * Implementacion por correo del puerto OrderNotifier del checkout.
 *
 * Es el punto donde se unen tres modulos: checkout declara que quiere
 * notificar, notifications decide que eso significa enviar un correo, y
 * settings aporta los datos de pago vigentes (cuentas, QR, plazo) que las
 * plantillas necesitan. Ninguno de los tres importa la infraestructura de
 * los otros dos.
 */
@Injectable()
export class EmailOrderNotifier extends OrderNotifier {
  constructor(
    private readonly emails: EmailSender,
    private readonly storeSettings: StoreSettingsRepository,
  ) {
    super();
  }

  async notifyPaymentPending(order: Order): Promise<void> {
    const settings = await this.storeSettings.get();
    const message = renderOrderPendingPayment(order, settings);
    await this.emails.send({ to: order.customer.email, ...message });
  }

  async notifyPaymentConfirmed(order: Order): Promise<void> {
    const settings = await this.storeSettings.get();
    const message = renderOrderPaymentConfirmed(order, settings);
    await this.emails.send({ to: order.customer.email, ...message });
  }
}
