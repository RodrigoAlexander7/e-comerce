import { getFacets, listProducts } from "@/lib/api/catalog";
import { ProductGrid } from "@/components/catalog/product-grid";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { Pagination } from "@/components/catalog/pagination";
import type { ProductSort } from "@/lib/api/types";

const PER_PAGE = 9;

export interface CatalogSearchParams {
  sizes?: string;
  colors?: string;
  inStock?: string;
  sort?: string;
  page?: string;
  search?: string;
}

const VALID_SORTS: ProductSort[] = ["newest", "price_asc", "price_desc", "name_asc"];

function parseSort(value: string | undefined): ProductSort {
  return VALID_SORTS.includes(value as ProductSort) ? (value as ProductSort) : "newest";
}

function parsePage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

/**
 * Listado de catalogo compartido por la tienda completa y por cada categoria.
 *
 * Lee los filtros de la URL, consulta la API ya filtrada y pinta el resultado.
 * Ambas paginas se apoyan en este componente para que el comportamiento sea
 * identico y no haya dos implementaciones que mantener.
 */
export async function CatalogView({
  title,
  description,
  categorySlug,
  basePath,
  searchParams,
}: {
  title: string;
  description?: string | null;
  categorySlug?: string;
  basePath: string;
  searchParams: CatalogSearchParams;
}) {
  const query = {
    category: categorySlug,
    search: searchParams.search,
    sizes: searchParams.sizes?.split(",").filter(Boolean),
    colors: searchParams.colors?.split(",").filter(Boolean),
    inStock: searchParams.inStock === "true",
    sort: parseSort(searchParams.sort),
    page: parsePage(searchParams.page),
    perPage: PER_PAGE,
  };

  const [page, facets] = await Promise.all([listProducts(query), getFacets(categorySlug)]);

  return (
    <div className="shell py-12 md:py-16">
      <header className="border-b border-line pb-8">
        <h1 className="font-display text-5xl md:text-6xl">{title}</h1>
        {description ? (
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">{description}</p>
        ) : null}
      </header>

      <div className="mt-10 grid gap-12 lg:grid-cols-[16rem_1fr] lg:gap-16">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <CatalogFilters facets={facets} />
        </aside>

        <div>
          <p className="label-caps mb-8 text-muted" aria-live="polite">
            {page.total} {page.total === 1 ? "prenda" : "prendas"}
          </p>

          <ProductGrid products={page.items} />

          <Pagination
            page={page}
            basePath={basePath}
            searchParams={searchParams as Record<string, string | undefined>}
          />
        </div>
      </div>
    </div>
  );
}
