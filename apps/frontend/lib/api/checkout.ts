import { apiGet, apiPost } from "./client";
import type {
  CartQuote,
  Department,
  OrderResponse,
  ShippingMethod,
} from "./types";

export interface CartLinePayload {
  variantId: string;
  quantity: number;
}

/** Tasa el carrito con los precios vigentes del catalogo. */
export function quoteCart(
  lines: CartLinePayload[],
  shippingMethodId?: string,
): Promise<CartQuote> {
  return apiPost<CartQuote>("/checkout/quote", {
    lines,
    ...(shippingMethodId ? { shippingMethodId } : {}),
  });
}

export function listShippingMethods(): Promise<ShippingMethod[]> {
  // Cambian muy poco; una revalidacion cada cinco minutos es de sobra.
  return apiGet<ShippingMethod[]>("/checkout/shipping-methods", {}, { revalidate: 300 });
}

export function listDepartments(): Promise<Department[]> {
  // Datos de referencia practicamente inmutables: se cachean un dia entero.
  return apiGet<Department[]>("/locations/peru", {}, { revalidate: 86_400 });
}

export interface PlaceOrderPayload {
  lines: CartLinePayload[];
  shippingMethodId: string;
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  idType: string;
  idNumber: string;
  needsInvoice: boolean;
  businessName?: string;
  ruc?: string;
  shippingAddress: Record<string, string | undefined>;
  billingAddress?: Record<string, string | undefined>;
  customerNote?: string;
}

export function placeOrder(payload: PlaceOrderPayload): Promise<OrderResponse> {
  return apiPost<OrderResponse>("/checkout/orders", payload);
}

export function findOrder(number: string, email: string): Promise<OrderResponse> {
  return apiGet<OrderResponse>("/checkout/orders", { number, email }, { revalidate: 0 });
}
