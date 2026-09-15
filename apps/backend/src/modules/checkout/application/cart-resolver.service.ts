import { Injectable } from '@nestjs/common';
import {
  ProductRepository,
  type VariantWithProduct,
} from '../../catalog/domain/repositories/product.repository.js';
import { OrderItem } from '../domain/entities/order-item.entity.js';
import { EmptyCartError } from '../domain/errors.js';

/** Linea tal como llega del navegador: solo identificador y cantidad. */
export interface CartLineInput {
  readonly variantId: string;
  readonly quantity: number;
}

/** Motivo por el que una linea no pudo mantenerse tal cual se pidio. */
export type CartIssueKind = 'UNAVAILABLE' | 'INSUFFICIENT_STOCK';

export interface CartIssue {
  readonly variantId: string;
  readonly kind: CartIssueKind;
  readonly message: string;
  /** Unidades que si se pueden atender. Cero si la prenda ya no se vende. */
  readonly available: number;
}

export interface ResolvedCart {
  readonly items: readonly OrderItem[];
  readonly issues: readonly CartIssue[];
}

/**
 * Convierte un carrito del navegador en lineas de orden con precio autoritativo.
 *
 * El navegador solo envia identificadores y cantidades: el precio, el nombre y
 * el stock se releen siempre del catalogo. Confiar en un precio enviado por el
 * cliente permitiria comprar una casaca por un sol manipulando la peticion.
 *
 * Devuelve las incidencias en vez de lanzar una excepcion en la primera: si el
 * carrito tiene tres problemas, el cliente debe verlos todos de una vez y no
 * descubrirlos de uno en uno en tres intentos.
 */
@Injectable()
export class CartResolver {
  constructor(private readonly products: ProductRepository) {}

  async resolve(lines: readonly CartLineInput[]): Promise<ResolvedCart> {
    if (lines.length === 0) {
      throw new EmptyCartError();
    }

    // Se agrupan las repeticiones del mismo identificador para que enviar dos
    // veces la misma variante no eluda la comprobacion de stock.
    const requested = new Map<string, number>();
    for (const line of lines) {
      requested.set(line.variantId, (requested.get(line.variantId) ?? 0) + line.quantity);
    }

    const found = await this.products.findVariantsByIds([...requested.keys()]);
    const byId = new Map(found.map((entry) => [entry.variant.id, entry]));

    const items: OrderItem[] = [];
    const issues: CartIssue[] = [];

    for (const [variantId, quantity] of requested) {
      const entry = byId.get(variantId);

      if (!entry || !this.isSellable(entry)) {
        issues.push({
          variantId,
          kind: 'UNAVAILABLE',
          message: entry
            ? `${entry.product.name} (${entry.variant.label}) ya no esta disponible.`
            : 'Una de las prendas de tu carrito ya no existe en el catalogo.',
          available: 0,
        });
        continue;
      }

      const { variant, product } = entry;

      if (variant.stock < quantity) {
        issues.push({
          variantId,
          kind: 'INSUFFICIENT_STOCK',
          message:
            variant.stock === 0
              ? `${product.name} (${variant.label}) se agoto.`
              : `Solo quedan ${variant.stock} unidades de ${product.name} (${variant.label}).`,
          available: variant.stock,
        });
        // Se conserva lo que si hay disponible para que el cliente pueda
        // continuar con una cantidad menor en lugar de perder la linea entera.
        if (variant.stock === 0) continue;
      }

      items.push(
        new OrderItem({
          variantId: variant.id,
          productName: product.name,
          productSlug: product.slug,
          variantLabel: variant.label,
          sku: variant.sku,
          imageUrl: product.imageUrl,
          unitPrice: variant.effectivePrice(product.basePrice),
          quantity: Math.min(quantity, variant.stock),
        }),
      );
    }

    return { items, issues };
  }

  private isSellable(entry: VariantWithProduct): boolean {
    return entry.variant.isActive && entry.product.isActive;
  }
}
