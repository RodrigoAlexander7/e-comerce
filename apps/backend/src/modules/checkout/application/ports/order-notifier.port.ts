import type { Order } from '../../domain/entities/order.entity.js';

/**
 * Puerto de notificaciones de una orden.
 *
 * El caso de uso que confirma una compra no sabe si detras hay correo, SMS o
 * WhatsApp: solo anuncia que algo ocurrio. La implementacion concreta vive en
 * el modulo de notificaciones.
 */
export abstract class OrderNotifier {
  /** La orden se creo y espera que el cliente acredite el pago. */
  abstract notifyPaymentPending(order: Order): Promise<void>;
  /** Un administrador verifico el abono. */
  abstract notifyPaymentConfirmed(order: Order): Promise<void>;
}
