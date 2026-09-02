import { Inject, Injectable } from '@nestjs/common';
import { Money } from '../../../../shared/domain/money.js';
import { APP_CONFIG, type AppConfig } from '../../../../config/app-config.js';
import type { OrderItem } from '../../domain/entities/order-item.entity.js';
import { calculateOrderTotals, type OrderTotals } from '../../domain/services/order-pricing.js';
import { ShippingMethodRepository } from '../../domain/repositories/shipping-method.repository.js';
import { ShippingMethodNotFoundError } from '../../domain/errors.js';
import { CartResolver, type CartIssue, type CartLineInput } from '../cart-resolver.service.js';

export interface QuoteCartInput {
  readonly lines: readonly CartLineInput[];
  /** Ausente en los pasos previos a elegir la entrega. */
  readonly shippingMethodId?: string;
}

export interface CartQuote {
  readonly items: readonly OrderItem[];
  readonly issues: readonly CartIssue[];
  readonly totals: OrderTotals;
  readonly shippingMethodId: string | null;
  readonly shippingMethodName: string | null;
}

/**
 * Tasa un carrito con los precios vigentes del catalogo.
 *
 * Es la unica fuente de verdad del resumen que ve el cliente en los tres pasos
 * del checkout. Se vuelve a llamar en cada paso porque entre uno y otro puede
 * agotarse una talla o cambiar un precio.
 */
@Injectable()
export class QuoteCartUseCase {
  constructor(
    private readonly cartResolver: CartResolver,
    private readonly shippingMethods: ShippingMethodRepository,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async execute(input: QuoteCartInput): Promise<CartQuote> {
    const { items, issues } = await this.cartResolver.resolve(input.lines);

    // Sin metodo elegido todavia, el envio cuenta como cero: el resumen del
    // paso 1 muestra un guion en la fila de entrega, igual que la referencia.
    let shippingCost = Money.zero();
    let shippingMethodId: string | null = null;
    let shippingMethodName: string | null = null;

    if (input.shippingMethodId !== undefined) {
      const method = await this.shippingMethods.findActiveById(input.shippingMethodId);
      if (method === null) {
        throw new ShippingMethodNotFoundError(input.shippingMethodId);
      }
      shippingCost = method.price;
      shippingMethodId = method.id;
      shippingMethodName = method.name;
    }

    return {
      items,
      issues,
      totals: calculateOrderTotals(items, shippingCost, this.config.taxRateBps),
      shippingMethodId,
      shippingMethodName,
    };
  }
}
