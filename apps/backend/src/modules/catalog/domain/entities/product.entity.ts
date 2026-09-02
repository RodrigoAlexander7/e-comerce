import { Money } from '../../../../shared/domain/money.js';
import { ProductVariant } from './product-variant.entity.js';

export interface ProductImage {
  readonly id: string;
  readonly url: string;
  readonly alt: string;
  readonly position: number;
}

export interface ProductCategoryRef {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
}

export interface ProductProps {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly category: ProductCategoryRef;
  /** Precio de lista con IGV incluido. */
  readonly basePrice: Money;
  /** Precio anterior tachado cuando la prenda esta en promocion. */
  readonly compareAtPrice: Money | null;
  readonly isActive: boolean;
  readonly isFeatured: boolean;
  readonly images: readonly ProductImage[];
  readonly variants: readonly ProductVariant[];
  readonly createdAt: Date;
}

/**
 * Prenda del catalogo. Agrega sus variantes: es la raiz por la que se navega
 * el inventario, aunque el stock concreto lo posea cada variante.
 */
export class Product {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly category: ProductCategoryRef;
  readonly basePrice: Money;
  readonly compareAtPrice: Money | null;
  readonly isActive: boolean;
  readonly isFeatured: boolean;
  readonly images: readonly ProductImage[];
  readonly variants: readonly ProductVariant[];
  readonly createdAt: Date;

  constructor(props: ProductProps) {
    this.id = props.id;
    this.name = props.name;
    this.slug = props.slug;
    this.description = props.description;
    this.category = props.category;
    this.basePrice = props.basePrice;
    this.compareAtPrice = props.compareAtPrice;
    this.isActive = props.isActive;
    this.isFeatured = props.isFeatured;
    this.images = [...props.images].sort((a, b) => a.position - b.position);
    this.variants = props.variants;
    this.createdAt = props.createdAt;
  }

  get primaryImage(): ProductImage | null {
    return this.images[0] ?? null;
  }

  /** Hay al menos una talla o color con existencias. */
  get isInStock(): boolean {
    return this.variants.some((variant) => variant.isAvailable);
  }

  get totalStock(): number {
    return this.variants.reduce((sum, variant) => sum + variant.stock, 0);
  }

  get isOnSale(): boolean {
    return this.compareAtPrice !== null && this.compareAtPrice.greaterThan(this.basePrice);
  }

  /**
   * Precio mas bajo entre las variantes disponibles, para el rotulo "desde"
   * del listado cuando distintas tallas cuestan distinto.
   */
  get lowestPrice(): Money {
    const available = this.variants.filter((variant) => variant.isAvailable);
    const source = available.length > 0 ? available : this.variants;
    return source.reduce<Money>(
      (lowest, variant) => {
        const price = variant.effectivePrice(this.basePrice);
        return price.cents < lowest.cents ? price : lowest;
      },
      source[0]?.effectivePrice(this.basePrice) ?? this.basePrice,
    );
  }

  /** Tallas con existencias, en el orden en que llegan del repositorio. */
  get availableSizes(): string[] {
    return [...new Set(this.variants.filter((v) => v.isAvailable).map((v) => v.size))];
  }

  /** Colores distintos ofrecidos, agotados incluidos, para el swatch del listado. */
  get colors(): { name: string; hex: string }[] {
    const seen = new Map<string, string>();
    for (const variant of this.variants) {
      if (!seen.has(variant.colorName)) seen.set(variant.colorName, variant.colorHex);
    }
    return [...seen].map(([name, hex]) => ({ name, hex }));
  }

  findVariant(variantId: string): ProductVariant | null {
    return this.variants.find((variant) => variant.id === variantId) ?? null;
  }
}
