import { Injectable } from '@nestjs/common';
import type { Page, PageRequest } from '../../../../../shared/domain/pagination.js';
import type { Order } from '../../../domain/entities/order.entity.js';
import { OrderRepository, type OrderAdminFilter } from '../../../domain/repositories/order.repository.js';

/** Listado de ordenes del panel, con filtro por estado y busqueda libre. */
@Injectable()
export class ListOrdersAdminUseCase {
  constructor(private readonly orders: OrderRepository) {}

  execute(filter: OrderAdminFilter, page: PageRequest): Promise<Page<Order>> {
    return this.orders.listAdmin(filter, page);
  }
}
