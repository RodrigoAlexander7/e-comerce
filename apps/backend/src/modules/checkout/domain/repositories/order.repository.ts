import type { Order, OrderStatusValue } from '../entities/order.entity.js';
import type { OrderItem } from '../entities/order-item.entity.js';
import type { OrderTotals } from '../services/order-pricing.js';
import type { Page, PageRequest } from '../../../../shared/domain/pagination.js';
import type { Address } from '../value-objects/address.js';
import type { CustomerDetails } from '../value-objects/customer-details.js';
import type { InvoiceDetails } from '../value-objects/invoice-details.js';
import type { PaymentMethodValue } from '../entities/order.entity.js';

/** Todo lo necesario para materializar una orden nueva. */
export interface NewOrderDraft {
  readonly userId: string | null;
  readonly paymentMethod: PaymentMethodValue;
  readonly customer: CustomerDetails;
  readonly invoice: InvoiceDetails | null;
  readonly shippingAddress: Address;
  readonly billingAddress: Address;
  readonly shippingMethodId: string;
  readonly shippingMethodName: string;
  readonly items: readonly OrderItem[];
  readonly totals: OrderTotals;
  readonly paymentDueAt: Date;
  readonly customerNote: string | null;
}

/**
 * Puerto de persistencia de ordenes.
 *
 * `place` tiene un contrato mas fuerte que un simple guardado: debe asignar el
 * numero de orden y descontar el stock de cada variante de forma atomica, todo
 * dentro de la misma transaccion.
 *
 * Esa exigencia vive en el puerto, y no como pasos separados en el caso de uso,
 * porque la atomicidad solo puede garantizarla el motor de base de datos: si el
 * caso de uso comprobara el stock y luego pidiera guardar, dos compras
 * simultaneas de la ultima unidad pasarian ambas la comprobacion. La
 * implementacion debe lanzar InsufficientStockError si no puede reservar.
 */
export abstract class OrderRepository {
  abstract place(draft: NewOrderDraft): Promise<Order>;
  abstract findByNumber(number: string): Promise<Order | null>;
  abstract findById(id: string): Promise<Order | null>;
  /** Vincula una orden de invitado a una cuenta recien registrada. */
  abstract attachToUser(orderId: string, userId: string): Promise<void>;

  /**
   * Adopta todas las compras hechas como invitado con ese correo.
   *
   * Se ejecuta al iniciar sesion. Solo alcanza ordenes sin dueno: una orden ya
   * vinculada a otra cuenta jamas cambia de manos, aunque compartan correo.
   *
   * @returns Cuantas ordenes quedaron vinculadas.
   */
  abstract attachGuestOrdersByEmail(email: string, userId: string): Promise<number>;
  abstract updateStatus(
    orderId: string,
    next: OrderStatusValue,
    context: { changedById: string | null; note: string | null },
  ): Promise<Order>;

  /** Listado del panel: filtra por estado y busca por numero, nombre o correo. */
  abstract listAdmin(filter: OrderAdminFilter, page: PageRequest): Promise<Page<Order>>;

  /** Ordenes pendientes de pago cuyo plazo ya vencio. Para el dashboard y una futura tarea de limpieza. */
  abstract countOverduePending(): Promise<number>;

  /** Suma de ordenes PAGADO o superior creadas dentro del rango. Para "ventas del mes". */
  abstract sumRevenue(from: Date, to: Date): Promise<number>;

  abstract countByStatus(status: OrderStatusValue): Promise<number>;
}

export interface OrderAdminFilter {
  readonly status?: OrderStatusValue;
  readonly search?: string;
}
