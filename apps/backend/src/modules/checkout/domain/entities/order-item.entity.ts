import { Money } from '../../../../shared/domain/money.js';
import { InvalidValueError } from '../../../../shared/domain/domain-error.js';

export interface OrderItemProps {
  readonly variantId: string | null;
  readonly productName: string;
  readonly productSlug: string;
  readonly variantLabel: string;
  readonly sku: string;
  readonly imageUrl: string | null;
  /** Precio unitario con IGV incluido, congelado en el momento de la compra. */
  readonly unitPrice: Money;
  readonly quantity: number;
}

/**
 * Linea de una orden.
 *
 * Guarda una descripcion textual de lo comprado ademas del identificador de la
 * variante: si la prenda desaparece del catalogo, la orden debe seguir siendo
 * legible para el cliente y para contabilidad.
 */
export class OrderItem {
  readonly variantId: string | null;
  readonly productName: string;
  readonly productSlug: string;
  readonly variantLabel: string;
  readonly sku: string;
  readonly imageUrl: string | null;
  readonly unitPrice: Money;
  readonly quantity: number;

  constructor(props: OrderItemProps) {
    if (!Number.isInteger(props.quantity) || props.quantity < 1) {
      throw new InvalidValueError(
        `La cantidad de "${props.productName}" debe ser un entero positivo, se recibio ${props.quantity}.`,
      );
    }
    this.variantId = props.variantId;
    this.productName = props.productName;
    this.productSlug = props.productSlug;
    this.variantLabel = props.variantLabel;
    this.sku = props.sku;
    this.imageUrl = props.imageUrl;
    this.unitPrice = props.unitPrice;
    this.quantity = props.quantity;
  }

  /** Importe de la linea con IGV incluido. */
  get lineTotal(): Money {
    return this.unitPrice.multiply(this.quantity);
  }
}
