import Link from "next/link";
import type { Paginated, ProductSummary } from "@/lib/api/types";

/**
 * Paginacion como enlaces reales.
 *
 * Se construyen href completos en lugar de botones con JavaScript para que
 * cada pagina sea indexable, compartible y navegable sin scripts.
 */
export function Pagination({
  page,
  basePath,
  searchParams,
}: {
  page: Paginated<ProductSummary>;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  if (page.totalPages <= 1) return null;

  function hrefFor(target: number): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && key !== "page") params.set(key, value);
    }
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  const pages = Array.from({ length: page.totalPages }, (_, index) => index + 1);

  return (
    <nav aria-label="Paginacion" className="mt-16 flex items-center justify-center gap-2">
      {page.page > 1 ? (
        <Link
          href={hrefFor(page.page - 1)}
          rel="prev"
          className="label-caps grid h-11 place-items-center border border-line px-4 transition-colors hover:border-ink"
        >
          Anterior
        </Link>
      ) : null}

      <ul className="flex items-center gap-1">
        {pages.map((number) => {
          const current = number === page.page;
          return (
            <li key={number}>
              <Link
                href={hrefFor(number)}
                aria-current={current ? "page" : undefined}
                className={`grid size-11 place-items-center border text-sm font-medium tabular-nums transition-colors ${
                  current
                    ? "border-ink bg-ink text-paper"
                    : "border-line text-ink hover:border-ink"
                }`}
              >
                {number}
              </Link>
            </li>
          );
        })}
      </ul>

      {page.page < page.totalPages ? (
        <Link
          href={hrefFor(page.page + 1)}
          rel="next"
          className="label-caps grid h-11 place-items-center border border-line px-4 transition-colors hover:border-ink"
        >
          Siguiente
        </Link>
      ) : null}
    </nav>
  );
}
