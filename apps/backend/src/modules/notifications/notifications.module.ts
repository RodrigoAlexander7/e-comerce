import { Module } from '@nestjs/common';
import { OrderNotifier } from '../checkout/application/ports/order-notifier.port.js';
import { SettingsModule } from '../settings/settings.module.js';
import { EmailSender } from './domain/ports/email-sender.port.js';
import { NodemailerEmailSender } from './infrastructure/nodemailer-email-sender.js';
import { EmailOrderNotifier } from './application/email-order-notifier.js';

/**
 * Modulo de notificaciones.
 *
 * Exporta OrderNotifier, el puerto que declara el checkout, para que el
 * contenedor pueda satisfacer esa dependencia sin que checkout conozca ni
 * Nodemailer ni las plantillas. Importa SettingsModule por los datos de pago
 * que las plantillas necesitan (cuentas, QR, plazo), sin conocer que viven en
 * una tabla editable desde el panel.
 */
@Module({
  imports: [SettingsModule],
  providers: [
    { provide: EmailSender, useClass: NodemailerEmailSender },
    { provide: OrderNotifier, useClass: EmailOrderNotifier },
  ],
  exports: [OrderNotifier, EmailSender],
})
export class NotificationsModule {}
