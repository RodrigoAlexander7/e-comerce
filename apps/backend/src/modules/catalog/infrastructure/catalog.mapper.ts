import { Money } from '../../../shared/domain/money.js';
import type { Prisma } from '../../../shared/infrastructure/prisma/generated-client.js';
import { Category } from '../domain/entities/category.entity.js';
import { Product } from '../domain/entities/product.entity.js';
import { ProductVariant } from '../domain/entities/product-variant.entity.js';

/**
 * Forma exacta con la que se consultan las prendas en la base de datos.
 *
 * Se usa "satisfies" en lugar de una anotacion de tipo para que TypeScript
 * conserve la forma literal del objeto: de ella se deriva ProductRow mas
 * abajo, de modo que anadir una relacion aqui actualiza el tipo del mapper
 * automaticamente y el compilador avisa si se olvida mapearla.
 */
export const PRODUCT_INCLUDE = {
  category: true,
  images: { orderBy: { position: 'asc' } },
  variants: { orderBy: [{ colorName: 'asc' }, { size: 'asc' }] },
} satisfies Prisma.ProductInclude;

export const CATEGORY_INCLUDE = {
  _count: { select: { products: { where: { isActive: true } } } },
} satisfies Prisma.CategoryInclude;

/** Fila de producto con sus relaciones, derivada de la consulta real. */
export type ProductRow = Prisma.ProductGetPayload<{ include: typeof PRODUCT_INCLUDE }>;
export type VariantRow = ProductRow['variants'][number];
export type CategoryRow = Prisma.CategoryGetPayload<{ include: typeof CATEGORY_INCLUDE }>;

/**
 * Traduce filas de PostgreSQL a entidades de dominio.
 *
 * Es la frontera de la arquitectura: por encima de esta funcion nadie vuelve a
 * ver un tipo de Prisma, y por debajo nadie ve una entidad.
 */
export function toDomainProduct(row: ProductRow): Product {
  return new Product({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    category: { id: row.category.id, name: row.category.name, slug: row.category.slug },
    basePrice: Money.fromCents(row.basePriceCents),
    compareAtPrice:
      row.compareAtPriceCents === null ? null : Money.fromCents(row.compareAtPriceCents),
    isActive: row.isActive,
    isFeatured: row.isFeatured,
    images: row.images.map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt,
      position: image.position,
    })),
    variants: row.variants.map(toDomainVariant),
    createdAt: row.createdAt,
  });
}

export function toDomainVariant(row: VariantRow): ProductVariant {
  return new ProductVariant({
    id: row.id,
    productId: row.productId,
    sku: row.sku,
    size: row.size,
    colorName: row.colorName,
    colorHex: row.colorHex,
    stock: row.stock,
    lowStockThreshold: row.lowStockThreshold,
    price: row.priceCents === null ? null : Money.fromCents(row.priceCents),
    isActive: row.isActive,
  });
}

export function toDomainCategory(row: CategoryRow): Category {
  return new Category({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    position: row.position,
    isActive: row.isActive,
    productCount: row._count.products,
  });
}
