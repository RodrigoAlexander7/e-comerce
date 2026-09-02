import type { Money } from '../../../../shared/domain/money.js';
import type { Page, PageRequest } from '../../../../shared/domain/pagination.js';
import type { Product } from '../entities/product.entity.js';
import type { ProductVariant } from '../entities/product-variant.entity.js';

export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'name_asc';

/** Criterios de busqueda del catalogo publico. */
export interface ProductFilter {
  readonly categorySlug?: string;
  readonly search?: string;
  readonly sizes?: readonly string[];
  readonly colors?: readonly string[];
  readonly minPriceCents?: number;
  readonly maxPriceCents?: number;
  readonly onlyInStock?: boolean;
  readonly onlyFeatured?: boolean;
  /** Incluir prendas deshabilitadas. Reservado al panel de administracion. */
  readonly includeInactive?: boolean;
}

/**
 * Puerto de acceso a prendas.
 *
 * Se declara como clase abstracta y no como interfaz de TypeScript porque las
 * interfaces se borran al compilar y el contenedor de Nest necesita un token
 * que exista en tiempo de ejecucion. Asi el caso de uso depende de esta
 * abstraccion y la implementacion concreta con Prisma se inyecta desde el
 * modulo, sin que la capa de aplicacion sepa que existe una base de datos.
 */
export abstract class ProductRepository {
  abstract findMany(filter: ProductFilter, page: PageRequest, sort: ProductSort): Promise<Page<Product>>;
  abstract findBySlug(slug: string, includeInactive?: boolean): Promise<Product | null>;
  abstract findById(id: string, includeInactive?: boolean): Promise<Product | null>;
  /** Facetas disponibles para construir los filtros del listado. */
  abstract findFacets(categorySlug?: string): Promise<ProductFacets>;

  /**
   * Resuelve variantes sueltas por identificador, con los datos de su prenda.
   *
   * Lo necesita el checkout para tasar un carrito: el navegador envia solo
   * identificadores y cantidades, y el precio autoritativo se lee siempre aqui,
   * nunca de lo que llegue en la peticion.
   *
   * Devuelve solo las que existen; el llamante decide que hacer con las que
   * faltan, porque el motivo (retirada del catalogo o identificador invalido)
   * cambia el mensaje que ve el cliente.
   */
  abstract findVariantsByIds(ids: readonly string[]): Promise<VariantWithProduct[]>;

  // --- Escritura, reservada al panel de administracion --------------------

  abstract create(input: CreateProductInput): Promise<Product>;
  abstract update(id: string, patch: UpdateProductInput): Promise<Product>;
  abstract setActive(id: string, isActive: boolean): Promise<Product>;

  abstract createVariant(productId: string, input: VariantInput): Promise<Product>;
  abstract updateVariant(variantId: string, patch: Partial<VariantInput>): Promise<Product>;
  abstract deleteVariant(variantId: string): Promise<Product>;

  /** Variantes activas con existencias por debajo de su propio umbral, para el panel. */
  abstract findLowStockVariants(limit: number): Promise<LowStockVariant[]>;
}

export interface LowStockVariant {
  readonly variantId: string;
  readonly sku: string;
  readonly size: string;
  readonly colorName: string;
  readonly stock: number;
  readonly lowStockThreshold: number;
  readonly productId: string;
  readonly productName: string;
  readonly productSlug: string;
}

export interface VariantInput {
  readonly sku: string;
  readonly size: string;
  readonly colorName: string;
  readonly colorHex: string;
  readonly stock: number;
  readonly lowStockThreshold?: number;
  /** Nulo para heredar el precio base del producto. */
  readonly priceCents?: number | null;
  readonly isActive?: boolean;
}

export interface CreateProductInput {
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly categoryId: string;
  readonly basePriceCents: number;
  readonly compareAtPriceCents?: number | null;
  readonly isFeatured?: boolean;
  readonly images: readonly { url: string; alt: string }[];
  readonly variants: readonly VariantInput[];
}

/**
 * Parche de edicion de una prenda.
 *
 * `images`, cuando se incluye, reemplaza la lista completa: es un puñado de
 * fotos gestionadas desde un formulario, y reconciliar altas y bajas una a una
 * anadiria complejidad sin ningun beneficio real sobre reemplazar el conjunto.
 * Las variantes, en cambio, se gestionan por endpoints propios porque tienen
 * su propio ciclo de vida (stock que cambia con cada venta) y no conviene
 * arrastrarlas en cada edicion del producto.
 */
export interface UpdateProductInput {
  readonly name?: string;
  readonly description?: string;
  readonly categoryId?: string;
  readonly basePriceCents?: number;
  readonly compareAtPriceCents?: number | null;
  readonly isFeatured?: boolean;
  readonly images?: readonly { url: string; alt: string }[];
}

/** Variante junto al minimo de su prenda que necesita una linea de carrito. */
export interface VariantWithProduct {
  readonly variant: ProductVariant;
  readonly product: {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
    readonly basePrice: Money;
    readonly imageUrl: string | null;
    readonly isActive: boolean;
  };
}

export interface ProductFacets {
  readonly sizes: readonly string[];
  readonly colors: readonly { name: string; hex: string }[];
  readonly minPriceCents: number;
  readonly maxPriceCents: number;
}
