import type { StoreSettings } from '../../settings/domain/entities/store-settings.entity.js';
import type { Order } from '../domain/entities/order.entity.js';
import type { ShippingMethod } from '../domain/entities/shipping-method.entity.js';
import type { CartQuote } from '../application/use-cases/quote-cart.use-case.js';

/** Contrato JSON del checkout que consume el frontend. */

export interface CartLineView {
  variantId: string | null;
  productName: string;
  productSlug: string;
  variantLabel: string;
  sku: string;
  imageUrl: string | null;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}

export interface TotalsView {
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  taxRateBps: number;
}

export interface CartQuoteView {
  items: CartLineView[];
  issues: { variantId: string; kind: string; message: string; available: number }[];
  totals: TotalsView;
  shippingMethodId: string | null;
  shippingMethodName: string | null;
}

export interface ShippingMethodView {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  isFree: boolean;
}

export interface AddressView {
  country: string;
  state: string;
  city: string;
  district: string;
  street: string;
  apartment: string | null;
}

export interface OrderView {
  number: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  paymentDueAt: string;
  customer: { name: string; email: string; phone: string; idType: string; idNumber: string };
  invoice: { businessName: string; ruc: string } | null;
  shippingAddress: AddressView;
  billingAddress: AddressView;
  shippingMethodName: string;
  items: CartLineView[];
  totals: TotalsView;
}

/**
 * Datos de pago que la pagina de confirmacion muestra al cliente.
 *
 * Salen de la configuracion del servidor y no de literales en el frontend:
 * cambiar el numero de Yape no debe exigir un despliegue de la tienda.
 */
export interface PaymentInstructionsView {
  companyName: string;
  companyRuc: string;
  companyEmail: string;
  yapePhone: string;
  /** Nulo mientras ningun administrador haya subido el QR desde el panel. */
  yapeQrUrl: string | null;
  whatsappUrl: string;
  bankAccounts: { bank: string; accountNumber: string; cci: string }[];
  paymentWindowHours: number;
}

export function toCartQuoteView(quote: CartQuote): CartQuoteView {
  return {
    items: quote.items.map(toCartLineView),
    issues: quote.issues.map((issue) => ({
      variantId: issue.variantId,
      kind: issue.kind,
      message: issue.message,
      available: issue.available,
    })),
    totals: toTotalsView(quote),
    shippingMethodId: quote.shippingMethodId,
    shippingMethodName: quote.shippingMethodName,
  };
}

export function toShippingMethodView(method: ShippingMethod): ShippingMethodView {
  return {
    id: method.id,
    name: method.name,
    description: method.description,
    priceCents: method.price.cents,
    isFree: method.isFree,
  };
}

export function toOrderView(order: Order): OrderView {
  return {
    number: order.number.value,
    status: order.status,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt.toISOString(),
    paymentDueAt: order.paymentDueAt.toISOString(),
    customer: {
      name: order.customer.name,
      email: order.customer.email,
      phone: order.customer.phone,
      idType: order.customer.identification.type,
      idNumber: order.customer.identification.number,
    },
    invoice:
      order.invoice === null
        ? null
        : { businessName: order.invoice.businessName, ruc: order.invoice.ruc },
    shippingAddress: toAddressView(order.shippingAddress),
    billingAddress: toAddressView(order.billingAddress),
    shippingMethodName: order.shippingMethodName,
    items: order.items.map(toCartLineView),
    totals: toTotalsView({ totals: order.totals }),
  };
}

export function toPaymentInstructionsView(
  settings: StoreSettings,
  orderNumber: string,
): PaymentInstructionsView {
  const message = `Hola, envio el comprobante de pago de mi orden ${orderNumber}.`;
  return {
    companyName: settings.companyName,
    companyRuc: settings.companyRuc,
    companyEmail: settings.companyEmail,
    yapePhone: settings.yapePhone,
    yapeQrUrl: settings.yapeQrUrl,
    whatsappUrl: `https://wa.me/${settings.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`,
    bankAccounts: settings.bankAccounts.map((account) => ({
      bank: account.bank,
      accountNumber: account.accountNumber,
      cci: account.cci,
    })),
    paymentWindowHours: settings.paymentWindowHours,
  };
}

function toAddressView(address: Order['shippingAddress']): AddressView {
  return {
    country: address.country,
    state: address.state,
    city: address.city,
    district: address.district,
    street: address.street,
    apartment: address.apartment,
  };
}

function toCartLineView(item: Order['items'][number]): CartLineView {
  return {
    variantId: item.variantId,
    productName: item.productName,
    productSlug: item.productSlug,
    variantLabel: item.variantLabel,
    sku: item.sku,
    imageUrl: item.imageUrl,
    unitPriceCents: item.unitPrice.cents,
    quantity: item.quantity,
    lineTotalCents: item.lineTotal.cents,
  };
}

function toTotalsView(source: { totals: Order['totals'] }): TotalsView {
  return {
    subtotalCents: source.totals.subtotal.cents,
    shippingCents: source.totals.shipping.cents,
    taxCents: source.totals.tax.cents,
    totalCents: source.totals.total.cents,
    taxRateBps: source.totals.taxRateBps,
  };
}
