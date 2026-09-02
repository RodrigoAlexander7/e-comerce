import { Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../../../shared/domain/domain-error.js';
import type { Order } from '../../../domain/entities/order.entity.js';
import { OrderRepository } from '../../../domain/repositories/order.repository.js';

/**
 * Detalle de una orden para el panel.
 *
 * A diferencia de GetOrderByNumberUseCase (checkout publico), no exige el
 * correo del comprador como segunda prueba: quien llega hasta aqui ya paso el
 * guardian de sesion con rol ADMIN, que es la autorizacion que corresponde.
 */
@Injectable()
export class GetOrderAdminUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute(orderId: string): Promise<Order> {
    const order = await this.orders.findById(orderId);
    if (order === null) throw new NotFoundError('la orden', orderId);
    return order;
  }
}
