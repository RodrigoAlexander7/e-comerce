import type { DashboardMetrics } from '../application/get-dashboard-metrics.use-case.js';

export interface DashboardView {
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

export function toDashboardView(metrics: DashboardMetrics): DashboardView {
  return {
    monthlySalesCents: metrics.monthlySalesCents,
    pendingVerificationCount: metrics.pendingVerificationCount,
    overduePendingCount: metrics.overduePendingCount,
    ordersByStatus: { ...metrics.ordersByStatus },
    lowStockVariants: metrics.lowStockVariants.map((variant) => ({ ...variant })),
  };
}
