import type { Order } from '../domain/entities/order.entity.js';
import { toOrderView, type OrderView } from './checkout.view-model.js';

/**
 * Vista de orden para el panel.
 *
 * Extiende la vista publica con lo que un administrador necesita y un cliente
 * nunca deberia recibir: el identificador interno (para las siguientes
 * llamadas de cambio de estado) y, cuando existe, la cuenta de usuario a la
 * que quedo vinculada la compra.
 */
export interface AdminOrderView extends OrderView {
  id: string;
  userId: string | null;
  adminNote: string | null;
}

export function toAdminOrderView(order: Order): AdminOrderView {
  return {
    ...toOrderView(order),
    id: order.id,
    userId: order.userId,
    adminNote: order.adminNote,
  };
}

export interface AdminOrderSummaryView {
  id: string;
  number: string;
  status: string;
  customerName: string;
  customerEmail: string;
  totalCents: number;
  paymentMethod: string;
  createdAt: string;
}

export function toAdminOrderSummaryView(order: Order): AdminOrderSummaryView {
  return {
    id: order.id,
    number: order.number.value,
    status: order.status,
    customerName: order.customer.name,
    customerEmail: order.customer.email,
    totalCents: order.totals.total.cents,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt.toISOString(),
  };
}
