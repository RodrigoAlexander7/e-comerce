import type { Category } from '../domain/entities/category.entity.js';
import type { Product } from '../domain/entities/product.entity.js';
import type { ProductVariant } from '../domain/entities/product-variant.entity.js';
import type { Page } from '../../../shared/domain/pagination.js';

/**
 * Contrato JSON que consume el frontend.
 *
 * Las entidades de dominio nunca se serializan directamente: exponen metodos y
 * objetos de valor que no deben cruzar la red, y atarlos al contrato publico
 * impediria refactorizarlas sin romper a los clientes.
 */
export interface ProductSummaryView {
  id: string;
  name: string;
  slug: string;
  categoryName: string;
  categorySlug: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  isOnSale: boolean;
  inStock: boolean;
  imageUrl: string | null;
  imageAlt: string;
  colors: { name: string; hex: string }[];
  availableSizes: string[];
}

export interface ProductVariantView {
  id: string;
  sku: string;
  size: string;
  colorName: string;
  colorHex: string;
  priceCents: number;
  stock: number;
  available: boolean;
}

export interface ProductDetailView extends ProductSummaryView {
  description: string;
  images: { id: string; url: string; alt: string }[];
  variants: ProductVariantView[];
}

export interface CategoryView {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  productCount: number;
}

export interface PageView<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export function toProductSummaryView(product: Product): ProductSummaryView {
  const image = product.primaryImage;
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    categoryName: product.category.name,
    categorySlug: product.category.slug,
    priceCents: product.lowestPrice.cents,
    compareAtPriceCents: product.compareAtPrice?.cents ?? null,
    isOnSale: product.isOnSale,
    inStock: product.isInStock,
    imageUrl: image?.url ?? null,
    imageAlt: image?.alt ?? product.name,
    colors: product.colors,
    availableSizes: product.availableSizes,
  };
}

export function toProductDetailView(product: Product): ProductDetailView {
  return {
    ...toProductSummaryView(product),
    description: product.description,
    images: product.images.map((image) => ({ id: image.id, url: image.url, alt: image.alt })),
    variants: product.variants.map((variant) => toVariantView(variant, product)),
  };
}

function toVariantView(variant: ProductVariant, product: Product): ProductVariantView {
  return {
    id: variant.id,
    sku: variant.sku,
    size: variant.size,
    colorName: variant.colorName,
    colorHex: variant.colorHex,
    priceCents: variant.effectivePrice(product.basePrice).cents,
    stock: variant.stock,
    available: variant.isAvailable,
  };
}

export function toCategoryView(category: Category): CategoryView {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    productCount: category.productCount,
  };
}

export function toPageView<D, V>(page: Page<D>, map: (item: D) => V): PageView<V> {
  return {
    items: page.items.map(map),
    total: page.total,
    page: page.page,
    perPage: page.perPage,
    totalPages: page.totalPages,
  };
}
