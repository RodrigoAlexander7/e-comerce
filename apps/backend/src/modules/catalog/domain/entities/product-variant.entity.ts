import { Money } from '../../../../shared/domain/money.js';
import { InvalidValueError } from '../../../../shared/domain/domain-error.js';

/**
 * Tallas admitidas por el catalogo.
 *
 * La base de datos guarda la talla como texto libre para no exigir una
 * migracion cada vez que entra una linea nueva (por ejemplo pantalones con
 * tallas numericas). La restriccion real vive aqui, en el dominio.
 */
export const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'UNICA'] as const;
export type ClothingSize = (typeof CLOTHING_SIZES)[number];

export function isClothingSize(value: string): value is ClothingSize {
  return (CLOTHING_SIZES as readonly string[]).includes(value);
}

export interface ProductVariantProps {
  readonly id: string;
  readonly productId: string;
  readonly sku: string;
  readonly size: string;
  readonly colorName: string;
  readonly colorHex: string;
  readonly stock: number;
  readonly lowStockThreshold: number;
  /** Precio propio de la variante. Si es nulo hereda el precio base del producto. */
  readonly price: Money | null;
  readonly isActive: boolean;
}

/**
 * Unidad real de venta e inventario: una talla y un color concretos.
 *
 * El stock vive aqui y no en Product porque una casaca negra en talla M puede
 * agotarse mientras la misma casaca en L sigue disponible.
 */
export class ProductVariant {
  readonly id: string;
  readonly productId: string;
  readonly sku: string;
  readonly size: string;
  readonly colorName: string;
  readonly colorHex: string;
  readonly stock: number;
  readonly lowStockThreshold: number;
  readonly price: Money | null;
  readonly isActive: boolean;

  constructor(props: ProductVariantProps) {
    if (props.stock < 0) {
      throw new InvalidValueError(`El stock de la variante ${props.sku} no puede ser negativo.`);
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(props.colorHex)) {
      throw new InvalidValueError(
        `El color de la variante ${props.sku} debe ser un hexadecimal de 6 digitos, se recibio "${props.colorHex}".`,
      );
    }
    this.id = props.id;
    this.productId = props.productId;
    this.sku = props.sku;
    this.size = props.size;
    this.colorName = props.colorName;
    this.colorHex = props.colorHex;
    this.stock = props.stock;
    this.lowStockThreshold = props.lowStockThreshold;
    this.price = props.price;
    this.isActive = props.isActive;
  }

  /** Precio efectivo de esta variante, con IGV incluido. */
  effectivePrice(productBasePrice: Money): Money {
    return this.price ?? productBasePrice;
  }

  get isAvailable(): boolean {
    return this.isActive && this.stock > 0;
  }

  get isLowStock(): boolean {
    return this.stock > 0 && this.stock <= this.lowStockThreshold;
  }

  /** Etiqueta legible para el resumen del carrito y de la orden. */
  get label(): string {
    return `${this.size} / ${this.colorName}`;
  }

  canFulfill(quantity: number): boolean {
    return this.isAvailable && this.stock >= quantity;
  }
}
