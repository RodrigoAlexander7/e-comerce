import { Money } from '../../../../shared/domain/money.js';
import { BusinessRuleError } from '../../../../shared/domain/domain-error.js';
import type { Address } from '../value-objects/address.js';
import type { CustomerDetails } from '../value-objects/customer-details.js';
import type { InvoiceDetails } from '../value-objects/invoice-details.js';
import type { OrderNumber } from '../value-objects/order-number.js';
import type { OrderItem } from './order-item.entity.js';
import type { OrderTotals } from '../services/order-pricing.js';

export const ORDER_STATUSES = [
  'PENDING_PAYMENT',
  'PAID',
  'SHIPPED',
  'COMPLETED',
  'CANCELLED',
] as const;
export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ['YAPE_PLIN', 'BANK_TRANSFER'] as const;
export type PaymentMethodValue = (typeof PAYMENT_METHODS)[number];

/**
 * Transiciones permitidas del ciclo de vida de una orden.
 *
 * Vive en el dominio y no en el panel de administracion para que ninguna ruta
 * (ni la API, ni un script, ni un futuro webhook) pueda llevar una orden a un
 * estado imposible, como pasar de cancelada a enviada.
 */
const ALLOWED_TRANSITIONS: Record<OrderStatusValue, readonly OrderStatusValue[]> = {
  PENDING_PAYMENT: ['PAID', 'CANCELLED'],
  PAID: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export interface OrderProps {
  readonly id: string;
  readonly number: OrderNumber;
  readonly userId: string | null;
  readonly status: OrderStatusValue;
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
  readonly paidAt: Date | null;
  readonly cancelledAt: Date | null;
  readonly customerNote: string | null;
  /** Nota interna del equipo, invisible para el cliente. */
  readonly adminNote: string | null;
  readonly createdAt: Date;
}

/**
 * Raiz del agregado de compra.
 *
 * Concentra lo que el cliente declaro, lo que compro y cuanto debe pagar. Su
 * estado solo avanza a traves de los metodos de transicion, nunca asignando el
 * campo directamente.
 */
export class Order {
  readonly id: string;
  readonly number: OrderNumber;
  readonly userId: string | null;
  readonly status: OrderStatusValue;
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
  readonly paidAt: Date | null;
  readonly cancelledAt: Date | null;
  readonly customerNote: string | null;
  readonly adminNote: string | null;
  readonly createdAt: Date;

  constructor(props: OrderProps) {
    if (props.items.length === 0) {
      throw new BusinessRuleError('Una orden no puede crearse sin lineas de producto.');
    }
    this.id = props.id;
    this.number = props.number;
    this.userId = props.userId;
    this.status = props.status;
    this.paymentMethod = props.paymentMethod;
    this.customer = props.customer;
    this.invoice = props.invoice;
    this.shippingAddress = props.shippingAddress;
    this.billingAddress = props.billingAddress;
    this.shippingMethodId = props.shippingMethodId;
    this.shippingMethodName = props.shippingMethodName;
    this.items = props.items;
    this.totals = props.totals;
    this.paymentDueAt = props.paymentDueAt;
    this.paidAt = props.paidAt;
    this.cancelledAt = props.cancelledAt;
    this.customerNote = props.customerNote;
    this.adminNote = props.adminNote;
    this.createdAt = props.createdAt;
  }

  get total(): Money {
    return this.totals.total;
  }

  get itemCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  get isAwaitingPayment(): boolean {
    return this.status === 'PENDING_PAYMENT';
  }

  /**
   * El plazo para acreditar el pago ya vencio.
   *
   * Solo tiene sentido mientras la orden sigue pendiente: una orden ya pagada
   * no "expira" aunque el pago llegara tarde.
   */
  isPaymentOverdue(now: Date = new Date()): boolean {
    return this.isAwaitingPayment && now.getTime() > this.paymentDueAt.getTime();
  }

  canTransitionTo(next: OrderStatusValue): boolean {
    return ALLOWED_TRANSITIONS[this.status].includes(next);
  }

  /**
   * Devuelve una copia con el estado avanzado.
   *
   * La entidad es inmutable: en vez de mutarse, produce una version nueva, de
   * modo que quien tuviera la anterior en memoria no ve un cambio inesperado.
   */
  transitionTo(next: OrderStatusValue, now: Date = new Date()): Order {
    if (!this.canTransitionTo(next)) {
      throw new BusinessRuleError(
        `No se puede pasar la orden ${this.number.value} de ${this.status} a ${next}.`,
      );
    }

    return new Order({
      ...this,
      status: next,
      paidAt: next === 'PAID' ? now : this.paidAt,
      cancelledAt: next === 'CANCELLED' ? now : this.cancelledAt,
    });
  }
}
