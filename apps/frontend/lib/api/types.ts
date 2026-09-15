/**
 * Contrato JSON del backend.
 *
 * Se escribe a mano y no se genera para que el frontend dependa del contrato
 * publico de la API y no de los tipos internos del dominio de NestJS. Si el
 * backend cambia una respuesta, la ruptura aparece aqui de forma explicita.
 */

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  categoryName: string;
  categorySlug: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  isOnSale: boolean;
  inStock: boolean;
  imageUrl: string | null;
  imageAlt: string;
  colors: ProductColor[];
  availableSizes: string[];
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  size: string;
  colorName: string;
  colorHex: string;
  priceCents: number;
  stock: number;
  available: boolean;
}

export interface ProductDetail extends ProductSummary {
  description: string;
  images: { id: string; url: string; alt: string }[];
  variants: ProductVariant[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  productCount: number;
}

export interface ProductFacets {
  sizes: string[];
  colors: ProductColor[];
  minPriceCents: number;
  maxPriceCents: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export type ProductSort = "newest" | "price_asc" | "price_desc" | "name_asc";

// --- Checkout --------------------------------------------------------------

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

export interface Totals {
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  taxRateBps: number;
}

export interface CartIssue {
  variantId: string;
  kind: "UNAVAILABLE" | "INSUFFICIENT_STOCK" | string;
  message: string;
  available: number;
}

export interface CartQuote {
  items: CartLineView[];
  issues: CartIssue[];
  totals: Totals;
  shippingMethodId: string | null;
  shippingMethodName: string | null;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  isFree: boolean;
}

export interface OrderAddress {
  country: string;
  state: string;
  city: string;
  district: string;
  street: string;
  apartment: string | null;
}

export interface Order {
  number: string;
  status: string;
  paymentMethod: "YAPE_PLIN" | "BANK_TRANSFER" | string;
  createdAt: string;
  paymentDueAt: string;
  customer: { name: string; email: string; phone: string; idType: string; idNumber: string };
  invoice: { businessName: string; ruc: string } | null;
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  shippingMethodName: string;
  items: CartLineView[];
  totals: Totals;
}

export interface PaymentInstructions {
  companyName: string;
  companyRuc: string;
  companyEmail: string;
  yapePhone: string;
  yapeQrUrl: string;
  whatsappUrl: string;
  bankAccounts: { bank: string; accountNumber: string; cci: string }[];
  paymentWindowHours: number;
}

export interface OrderResponse {
  order: Order;
  payment: PaymentInstructions;
}

export interface Department {
  name: string;
  provinces: { name: string; districts: string[] }[];
}

export type IdentificationType = "DNI" | "CE" | "PASSPORT" | "RUC";
export type PaymentMethod = "YAPE_PLIN" | "BANK_TRANSFER";

// --- Autenticación ----------------------------------------------------------

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: "CUSTOMER" | "ADMIN" | "SUPERADMIN" | string;
}
