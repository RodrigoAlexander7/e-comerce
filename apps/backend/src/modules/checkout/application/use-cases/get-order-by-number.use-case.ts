import { Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../../shared/domain/domain-error.js';
import type { Order } from '../../domain/entities/order.entity.js';
import { OrderNumber } from '../../domain/value-objects/order-number.js';
import { OrderRepository } from '../../domain/repositories/order.repository.js';

/**
 * Recupera una orden por su codigo publico.
 *
 * Es la consulta de la pagina de confirmacion. El numero por si solo no es un
 * secreto suficiente para exponer datos personales, asi que el llamante debe
 * acreditar tambien el correo con el que se hizo la compra.
 */
@Injectable()
export class GetOrderByNumberUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute(rawNumber: string, email: string): Promise<Order> {
    const number = OrderNumber.fromString(rawNumber);
    const order = await this.orders.findByNumber(number.value);

    // Un correo que no coincide se responde igual que una orden inexistente:
    // distinguir ambos casos permitiria averiguar que numeros existen.
    if (order === null || !this.emailMatches(order, email)) {
      throw new NotFoundError('la orden', number.value);
    }

    return order;
  }

  private emailMatches(order: Order, email: string): boolean {
    return order.customer.email === email.trim().toLowerCase();
  }
}
