import { Injectable, Logger } from '@nestjs/common';
import { NotFoundError } from '../../../../../shared/domain/domain-error.js';
import type { Order, OrderStatusValue } from '../../../domain/entities/order.entity.js';
import { OrderRepository } from '../../../domain/repositories/order.repository.js';
import { OrderNotifier } from '../../ports/order-notifier.port.js';

export interface UpdateOrderStatusInput {
  readonly orderId: string;
  readonly next: OrderStatusValue;
  readonly changedById: string;
  readonly note?: string | null;
}

/**
 * Cambia el estado de una orden desde el panel, tras verificar el pago.
 *
 * La transicion se valida con las reglas del propio agregado Order
 * (Order.transitionTo) antes de escribir nada: pedir "COMPLETED" a una orden
 * que aun espera pago debe rechazarse aqui, no despues de haberlo guardado.
 *
 * Al llegar a PAID dispara el correo de pago verificado. Es el disparador
 * automatico que pide el panel: un administrador comprueba el abono a mano en
 * Yape o en la cuenta bancaria, cambia el estado, y el cliente se entera sin
 * que nadie tenga que escribirle.
 */
@Injectable()
export class UpdateOrderStatusUseCase {
  private readonly logger = new Logger(UpdateOrderStatusUseCase.name);

  constructor(
    private readonly orders: OrderRepository,
    private readonly notifier: OrderNotifier,
  ) {}

  async execute(input: UpdateOrderStatusInput): Promise<Order> {
    const current = await this.orders.findById(input.orderId);
    if (current === null) {
      throw new NotFoundError('la orden', input.orderId);
    }

    // Lanza BusinessRuleError si la transicion no esta permitida. El resultado
    // en si se descarta: solo sirve para validar antes de persistir.
    current.transitionTo(input.next);

    const updated = await this.orders.updateStatus(input.orderId, input.next, {
      changedById: input.changedById,
      note: input.note ?? null,
    });

    if (input.next === 'PAID') {
      try {
        await this.notifier.notifyPaymentConfirmed(updated);
      } catch (error) {
        this.logger.error(
          `No se pudo enviar el correo de pago confirmado de la orden ${updated.number.value}.`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    return updated;
  }
}
