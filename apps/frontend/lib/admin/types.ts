// Contratos JSON del panel de administracion. Reflejan los view models del
// backend (apps/backend/src/modules/*/presentation/*.view-model.ts).

export interface DashboardMetrics {
  monthlySalesCents: number;
  pendingVerificationCount: number;
  overduePendingCount: number;
  ordersByStatus: Record<string, number>;
  lowStockVariants: {
    variantId: string;
    sku: string;
    size: string;
    colorName: string;
    stock: number;
    lowStockThreshold: number;
    productId: string;
    productName: string;
    productSlug: string;
  }[];
}

export type OrderStatus = "PENDING_PAYMENT" | "PAID" | "SHIPPED" | "COMPLETED" | "CANCELLED";

export interface AdminOrderSummary {
  id: string;
  number: string;
  status: OrderStatus;
  customerName: string;
  customerEmail: string;
  totalCents: number;
  paymentMethod: string;
  createdAt: string;
}

export interface AdminOrderAddress {
  country: string;
  state: string;
  city: string;
  district: string;
  street: string;
  apartment: string | null;
}

export interface AdminOrderItem {
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

export interface AdminOrder {
  id: string;
  number: string;
  status: OrderStatus;
  paymentMethod: string;
  createdAt: string;
  paymentDueAt: string;
  userId: string | null;
  adminNote: string | null;
  customer: { name: string; email: string; phone: string; idType: string; idNumber: string };
  invoice: { businessName: string; ruc: string } | null;
  shippingAddress: AdminOrderAddress;
  billingAddress: AdminOrderAddress;
  shippingMethodName: string;
  items: AdminOrderItem[];
  totals: {
    subtotalCents: number;
    shippingCents: number;
    taxCents: number;
    totalCents: number;
    taxRateBps: number;
  };
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  position: number;
  isActive: boolean;
  productCount: number;
}

export interface AdminVariant {
  id: string;
  sku: string;
  size: string;
  colorName: string;
  colorHex: string;
  stock: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  isActive: boolean;
  priceCents: number | null;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  categoryName: string;
  basePriceCents: number;
  compareAtPriceCents: number | null;
  isActive: boolean;
  isFeatured: boolean;
  totalStock: number;
  images: { id: string; url: string; alt: string }[];
  variants: AdminVariant[];
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface BankAccount {
  id: string;
  bank: string;
  accountNumber: string;
  cci: string;
}

export interface StoreSettings {
  companyName: string;
  companyRuc: string;
  companyEmail: string;
  whatsapp: string;
  yapePhone: string;
  yapeQrUrl: string | null;
  paymentWindowHours: number;
  bankAccounts: BankAccount[];
  updatedAt: string;
}

export interface MediaAsset {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  createdAt: string;
}
