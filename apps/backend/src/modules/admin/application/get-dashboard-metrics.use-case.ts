import { Injectable } from '@nestjs/common';
import { ProductRepository, type LowStockVariant } from '../../catalog/domain/repositories/product.repository.js';
import { OrderRepository } from '../../checkout/domain/repositories/order.repository.js';

export interface DashboardMetrics {
  /** Suma de ordenes PAGADO o superior creadas este mes, en centimos. */
  readonly monthlySalesCents: number;
  /** Ordenes en PENDIENTE_PAGO que esperan verificacion manual. */
  readonly pendingVerificationCount: number;
  /** Ordenes pendientes cuyo plazo de pago ya vencio. */
  readonly overduePendingCount: number;
  readonly lowStockVariants: readonly LowStockVariant[];
  readonly ordersByStatus: Readonly<Record<string, number>>;
}

const TRACKED_STATUSES = ['PENDING_PAYMENT', 'PAID', 'SHIPPED', 'COMPLETED', 'CANCELLED'] as const;
const LOW_STOCK_LIMIT = 20;

/**
 * Agrega los indicadores del panel principal.
 *
 * Es el unico caso de uso del sistema que lee de dos agregados distintos
 * (Product y Order) en la misma operacion. Vive en su propio modulo por esa
 * razon: no pertenece de forma natural ni al catalogo ni al checkout, solo
 * consume los puertos que ambos ya exportan.
 */
@Injectable()
export class GetDashboardMetricsUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly orders: OrderRepository,
  ) {}

  async execute(): Promise<DashboardMetrics> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [monthlySalesCents, overduePendingCount, lowStockVariants, statusCounts] = await Promise.all([
      this.orders.sumRevenue(startOfMonth, startOfNextMonth),
      this.orders.countOverduePending(),
      this.products.findLowStockVariants(LOW_STOCK_LIMIT),
      Promise.all(TRACKED_STATUSES.map((status) => this.orders.countByStatus(status))),
    ]);

    const ordersByStatus: Record<string, number> = {};
    TRACKED_STATUSES.forEach((status, index) => {
      ordersByStatus[status] = statusCounts[index];
    });

    return {
      monthlySalesCents,
      // Se reutiliza el mismo conteo que ya se pidio para el desglose por
      // estado, en vez de repetir la consulta.
      pendingVerificationCount: ordersByStatus.PENDING_PAYMENT,
      overduePendingCount,
      lowStockVariants,
      ordersByStatus,
    };
  }
}
