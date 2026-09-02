import { apiGet } from "./client";
import type {
  Category,
  Paginated,
  ProductDetail,
  ProductFacets,
  ProductSort,
  ProductSummary,
} from "./types";

export interface ProductQuery {
  category?: string;
  search?: string;
  sizes?: string[];
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  sort?: ProductSort;
  page?: number;
  perPage?: number;
}

export function listProducts(query: ProductQuery = {}): Promise<Paginated<ProductSummary>> {
  return apiGet<Paginated<ProductSummary>>(
    "/catalog/products",
    {
      category: query.category,
      search: query.search,
      // La API espera listas separadas por coma, no parametros repetidos.
      sizes: query.sizes?.join(","),
      colors: query.colors?.join(","),
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      inStock: query.inStock ? "true" : undefined,
      featured: query.featured ? "true" : undefined,
      sort: query.sort,
      page: query.page,
      perPage: query.perPage,
    },
    { tags: ["catalog"] },
  );
}

export function getProduct(slug: string): Promise<ProductDetail> {
  return apiGet<ProductDetail>(`/catalog/products/${slug}`, {}, { tags: ["catalog", `product:${slug}`] });
}

export function listCategories(): Promise<Category[]> {
  return apiGet<Category[]>("/catalog/categories", {}, { tags: ["catalog"] });
}

export function getFacets(category?: string): Promise<ProductFacets> {
  return apiGet<ProductFacets>("/catalog/products/facets", { category }, { tags: ["catalog"] });
}
