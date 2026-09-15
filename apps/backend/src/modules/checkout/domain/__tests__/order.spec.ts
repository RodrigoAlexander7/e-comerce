import { describe, expect, it } from 'vitest';
import { Money } from '../../../../shared/domain/money.js';
import { BusinessRuleError, InvalidValueError } from '../../../../shared/domain/domain-error.js';
import { Order, type OrderStatusValue } from '../entities/order.entity.js';
import { OrderItem } from '../entities/order-item.entity.js';
import { calculateOrderTotals } from '../services/order-pricing.js';
import { OrderNumber } from '../value-objects/order-number.js';
import { Identification } from '../value-objects/identification.js';
import { CustomerDetails } from '../value-objects/customer-details.js';
import { Address } from '../value-objects/address.js';

function item(unitCents: number, quantity = 1, sku = 'SKU-1') {
  return new OrderItem({
    variantId: 'v1',
    productName: 'Casaca Cortavientos Ridge',
    productSlug: 'casaca-cortavientos-ridge',
    variantLabel: 'L / Arena',
    sku,
    imageUrl: null,
    unitPrice: Money.fromCents(unitCents),
    quantity,
  });
}

const ADDRESS = Address.create({
  country: 'Peru',
  state: 'Arequipa',
  city: 'Arequipa',
  district: 'Miraflores',
  street: 'Calle San Antonio 223',
});

function order(status: OrderStatusValue, items = [item(24_900)]) {
  return new Order({
    id: 'o1',
    number: OrderNumber.fromSequence(2415),
    userId: null,
    status,
    paymentMethod: 'YAPE_PLIN',
    customer: CustomerDetails.create({
      name: 'Juan Perez',
      email: 'juan@ejemplo.com',
      phone: '+51930900259',
      identification: Identification.create('DNI', '76435222'),
    }),
    invoice: null,
    shippingAddress: ADDRESS,
    billingAddress: ADDRESS,
    shippingMethodId: 's1',
    shippingMethodName: 'Envio Regular (Provincias)',
    items,
    totals: calculateOrderTotals(items, Money.fromCents(2_135), 1800),
    paymentDueAt: new Date('2026-09-09T12:00:00Z'),
    paidAt: null,
    cancelledAt: null,
    customerNote: null,
    adminNote: null,
    createdAt: new Date('2026-09-09T10:00:00Z'),
  });
}

describe('OrderItem', () => {
  it('multiplica el precio unitario por la cantidad', () => {
    expect(item(24_900, 3).lineTotal.cents).toBe(74_700);
  });

  it('rechaza cantidades no positivas o fraccionarias', () => {
    expect(() => item(24_900, 0)).toThrow(InvalidValueError);
    expect(() => item(24_900, 1.5)).toThrow(InvalidValueError);
  });
});

describe('calculateOrderTotals', () => {
  it('reproduce el desglose del checkout de referencia', () => {
    // Prenda de S/ 725.00 mas envio de S/ 21.35, exactamente la captura.
    const totals = calculateOrderTotals([item(72_500)], Money.fromCents(2_135), 1800);

    expect(totals.total.cents).toBe(74_635); // S/ 746.35
    expect(totals.subtotal.cents).toBe(63_250); // S/ 632.50
    expect(totals.tax.cents).toBe(11_385); // S/ 113.85
    expect(totals.shipping.cents).toBe(2_135); // S/ 21.35
  });

  it('mantiene el cuadre con varias lineas y cantidades', () => {
    const totals = calculateOrderTotals(
      [item(8_900, 3, 'A'), item(24_900, 2, 'B'), item(9_900, 1, 'C')],
      Money.fromCents(1_200),
      1800,
    );
    expect(totals.subtotal.add(totals.tax).cents).toBe(totals.total.cents);
    expect(totals.total.cents).toBe(8_900 * 3 + 24_900 * 2 + 9_900 + 1_200);
  });

  it('no cobra envio cuando la entrega es gratuita', () => {
    const totals = calculateOrderTotals([item(10_000)], Money.zero(), 1800);
    expect(totals.shipping.cents).toBe(0);
    expect(totals.total.cents).toBe(10_000);
  });
});

describe('Order', () => {
  it('no admite crearse sin lineas', () => {
    expect(() => order('PENDING_PAYMENT', [])).toThrow(BusinessRuleError);
  });

  it('cuenta las unidades, no las lineas', () => {
    expect(order('PENDING_PAYMENT', [item(1_000, 2, 'A'), item(2_000, 3, 'B')]).itemCount).toBe(5);
  });

  it('permite las transiciones del ciclo normal de venta', () => {
    const pending = order('PENDING_PAYMENT');
    expect(pending.canTransitionTo('PAID')).toBe(true);
    expect(pending.canTransitionTo('CANCELLED')).toBe(true);

    const paid = pending.transitionTo('PAID');
    expect(paid.status).toBe('PAID');
    expect(paid.paidAt).not.toBeNull();
    expect(paid.transitionTo('SHIPPED').transitionTo('COMPLETED').status).toBe('COMPLETED');
  });

  it('bloquea saltos imposibles del ciclo de vida', () => {
    // Enviar sin haber cobrado, o revivir una orden cancelada.
    expect(() => order('PENDING_PAYMENT').transitionTo('SHIPPED')).toThrow(BusinessRuleError);
    expect(() => order('CANCELLED').transitionTo('PAID')).toThrow(BusinessRuleError);
    expect(() => order('COMPLETED').transitionTo('CANCELLED')).toThrow(BusinessRuleError);
  });

  it('no muta la orden original al transicionar', () => {
    const pending = order('PENDING_PAYMENT');
    pending.transitionTo('PAID');
    expect(pending.status).toBe('PENDING_PAYMENT');
    expect(pending.paidAt).toBeNull();
  });

  it('considera vencido el plazo solo mientras espera el pago', () => {
    const despues = new Date('2026-09-09T13:00:00Z');
    expect(order('PENDING_PAYMENT').isPaymentOverdue(despues)).toBe(true);
    expect(order('PENDING_PAYMENT').isPaymentOverdue(new Date('2026-09-09T11:00:00Z'))).toBe(false);
    // Una orden ya cobrada no expira aunque el abono llegara tarde.
    expect(order('PAID').isPaymentOverdue(despues)).toBe(false);
  });
});
