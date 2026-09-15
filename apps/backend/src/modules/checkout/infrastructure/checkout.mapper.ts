import { Money } from '../../../shared/domain/money.js';
import type { Prisma } from '../../../shared/infrastructure/prisma/generated-client.js';
import { Order, type OrderStatusValue, type PaymentMethodValue } from '../domain/entities/order.entity.js';
import { OrderItem } from '../domain/entities/order-item.entity.js';
import { ShippingMethod } from '../domain/entities/shipping-method.entity.js';
import { Address } from '../domain/value-objects/address.js';
import { CustomerDetails } from '../domain/value-objects/customer-details.js';
import { Identification, type IdentificationTypeValue } from '../domain/value-objects/identification.js';
import { InvoiceDetails } from '../domain/value-objects/invoice-details.js';
import { OrderNumber } from '../domain/value-objects/order-number.js';

export const ORDER_INCLUDE = {
  items: true,
  addresses: true,
} satisfies Prisma.OrderInclude;

export type OrderRow = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;
export type ShippingMethodRow = Prisma.ShippingMethodGetPayload<object>;

export function toDomainShippingMethod(row: ShippingMethodRow): ShippingMethod {
  return new ShippingMethod({
    id: row.id,
    name: row.name,
    description: row.description,
    price: Money.fromCents(row.priceCents),
    position: row.position,
    isActive: row.isActive,
  });
}

/**
 * Reconstruye la orden desde la base de datos.
 *
 * Los objetos de valor se rehidratan por sus fabricas, de modo que una fila
 * corrupta (un correo invalido introducido a mano, por ejemplo) se detecta al
 * leerla en lugar de propagarse silenciosamente hasta una factura.
 */
export function toDomainOrder(row: OrderRow): Order {
  const shipping = row.addresses.find((address) => address.kind === 'SHIPPING');
  const billing = row.addresses.find((address) => address.kind === 'BILLING');

  if (!shipping || !billing) {
    throw new Error(`La orden ${row.number} no tiene sus dos direcciones registradas.`);
  }

  return new Order({
    id: row.id,
    number: OrderNumber.fromString(row.number),
    userId: row.userId,
    status: row.status as OrderStatusValue,
    paymentMethod: row.paymentMethod as PaymentMethodValue,
    customer: CustomerDetails.create({
      name: row.customerName,
      email: row.customerEmail,
      phone: row.customerPhone,
      identification: Identification.create(row.idType as IdentificationTypeValue, row.idNumber),
    }),
    invoice:
      row.needsInvoice && row.businessName !== null && row.ruc !== null
        ? InvoiceDetails.create(row.businessName, row.ruc)
        : null,
    shippingAddress: toDomainAddress(shipping),
    billingAddress: toDomainAddress(billing),
    shippingMethodId: row.shippingMethodId,
    shippingMethodName: row.shippingMethodName,
    items: row.items.map(toDomainOrderItem),
    totals: {
      subtotal: Money.fromCents(row.subtotalCents),
      shipping: Money.fromCents(row.shippingCents),
      tax: Money.fromCents(row.taxCents),
      total: Money.fromCents(row.totalCents),
      taxRateBps: row.taxRateBps,
    },
    paymentDueAt: row.paymentDueAt,
    paidAt: row.paidAt,
    cancelledAt: row.cancelledAt,
    customerNote: row.customerNote,
    adminNote: row.adminNote,
    createdAt: row.createdAt,
  });
}

function toDomainAddress(row: OrderRow['addresses'][number]): Address {
  return Address.create({
    country: row.country,
    state: row.state,
    city: row.city,
    district: row.district,
    street: row.street,
    apartment: row.apartment,
  });
}

function toDomainOrderItem(row: OrderRow['items'][number]): OrderItem {
  return new OrderItem({
    variantId: row.variantId,
    productName: row.productName,
    productSlug: row.productSlug,
    variantLabel: row.variantLabel,
    sku: row.sku,
    imageUrl: row.imageUrl,
    unitPrice: Money.fromCents(row.unitPriceCents),
    quantity: row.quantity,
  });
}
