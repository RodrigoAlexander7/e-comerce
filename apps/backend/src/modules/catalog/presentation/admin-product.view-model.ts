import type { Category } from '../domain/entities/category.entity.js';
import type { Product } from '../domain/entities/product.entity.js';
import type { ProductVariant } from '../domain/entities/product-variant.entity.js';

/**
 * Vista de producto para el panel.
 *
 * Se separa de ProductSummaryView/ProductDetailView del catalogo publico
 * porque aqui si importa exponer isActive, isLowStock y el precio propio de
 * cada variante (no el heredado): son datos operativos que la tienda publica
 * no necesita, y mezclarlos alli obligaria a los clientes de esa API a
 * ignorar campos que no les corresponden.
 */
export interface AdminVariantView {
  id: string;
  sku: string;
  size: string;
  colorName: string;
  colorHex: string;
  stock: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  isActive: boolean;
  /** Nulo cuando hereda el precio base de la prenda. */
  priceCents: number | null;
}

export interface AdminProductView {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  categoryName: string;
  basePriceCents: number;
  compareAtPriceCents: number | null;
  isActive: boolean;
  isFeatured: boolean;
  totalStock: number;
  images: { id: string; url: string; alt: string }[];
  variants: AdminVariantView[];
}

export interface AdminCategoryView {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  position: number;
  isActive: boolean;
  productCount: number;
}

export function toAdminProductView(product: Product): AdminProductView {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    categoryId: product.category.id,
    categoryName: product.category.name,
    basePriceCents: product.basePrice.cents,
    compareAtPriceCents: product.compareAtPrice?.cents ?? null,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    totalStock: product.totalStock,
    images: product.images.map((image) => ({ id: image.id, url: image.url, alt: image.alt })),
    variants: product.variants.map(toAdminVariantView),
  };
}

function toAdminVariantView(variant: ProductVariant): AdminVariantView {
  return {
    id: variant.id,
    sku: variant.sku,
    size: variant.size,
    colorName: variant.colorName,
    colorHex: variant.colorHex,
    stock: variant.stock,
    lowStockThreshold: variant.lowStockThreshold,
    isLowStock: variant.isLowStock,
    isActive: variant.isActive,
    priceCents: variant.price?.cents ?? null,
  };
}

/** Reutiliza el mismo shape que el catalogo publico: aqui no hace falta mas. */
export interface AdminCategoryInput {
  name: string;
  slug?: string;
  description?: string;
  position?: number;
}

export function toAdminCategoryView(category: Category): AdminCategoryView {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    position: category.position,
    isActive: category.isActive,
    productCount: category.productCount,
  };
}
