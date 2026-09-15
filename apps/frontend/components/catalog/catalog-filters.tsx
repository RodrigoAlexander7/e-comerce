"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { CheckIcon, CloseIcon } from "@/components/icons";
import type { ProductFacets, ProductSort } from "@/lib/api/types";

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Mas recientes" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "name_asc", label: "Nombre A-Z" },
];

/**
 * Filtros del listado.
 *
 * El estado vive en la URL y no en React. Asi un filtro concreto se puede
 * compartir por enlace, el boton de atras del navegador funciona como espera
 * cualquiera, y la pagina se sigue renderizando en el servidor con los datos
 * ya filtrados en lugar de pedirlos despues desde el navegador.
 */
export function CatalogFilters({ facets }: { facets: ProductFacets }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const applyParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      // Cualquier cambio de filtro invalida la pagina actual: volver a la
      // primera evita quedarse en una pagina 4 que ya no existe.
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  const toggleInList = useCallback(
    (key: string, value: string) => {
      applyParams((params) => {
        const current = (params.get(key) ?? "").split(",").filter(Boolean);
        const next = current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value];
        if (next.length > 0) params.set(key, next.join(","));
        else params.delete(key);
      });
    },
    [applyParams],
  );

  const selectedSizes = (searchParams.get("sizes") ?? "").split(",").filter(Boolean);
  const selectedColors = (searchParams.get("colors") ?? "").split(",").filter(Boolean);
  const onlyInStock = searchParams.get("inStock") === "true";
  const sort = (searchParams.get("sort") as ProductSort | null) ?? "newest";
  const hasFilters = selectedSizes.length > 0 || selectedColors.length > 0 || onlyInStock;

  return (
    <div
      // Atenua el panel mientras la navegacion esta en curso, para que se note
      // que la accion fue registrada antes de que lleguen los resultados.
      className={`flex flex-col gap-8 transition-opacity duration-200 ${
        isPending ? "opacity-60" : "opacity-100"
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className="label-caps">Filtros</h2>
        {hasFilters ? (
          <button
            type="button"
            onClick={() =>
              applyParams((params) => {
                params.delete("sizes");
                params.delete("colors");
                params.delete("inStock");
              })
            }
            className="label-caps inline-flex cursor-pointer items-center gap-1.5 text-muted transition-colors hover:text-accent"
          >
            <CloseIcon className="size-3.5" />
            Limpiar
          </button>
        ) : null}
      </div>

      <fieldset>
        <legend className="label-caps text-ash">Ordenar por</legend>
        <select
          value={sort}
          onChange={(event) =>
            applyParams((params) => params.set("sort", event.target.value))
          }
          className="mt-3 h-11 w-full cursor-pointer border border-line bg-paper px-3 text-sm focus:border-ink"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </fieldset>

      {facets.sizes.length > 0 ? (
        <fieldset>
          <legend className="label-caps text-ash">Talla</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {facets.sizes.map((size) => {
              const active = selectedSizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleInList("sizes", size)}
                  className={`h-11 min-w-11 cursor-pointer border px-3 text-sm font-medium transition-colors ${
                    active
                      ? "border-ink bg-ink text-paper"
                      : "border-line text-ink hover:border-ink"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {facets.colors.length > 0 ? (
        <fieldset>
          <legend className="label-caps text-ash">Color</legend>
          <ul className="mt-3 flex flex-col gap-1">
            {facets.colors.map((color) => {
              const active = selectedColors.includes(color.name);
              return (
                <li key={color.name}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleInList("colors", color.name)}
                    className="flex h-11 w-full cursor-pointer items-center gap-3 px-1 text-left text-sm transition-colors hover:text-accent"
                  >
                    <span
                      aria-hidden
                      className="size-4 rounded-full ring-1 ring-line ring-inset"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className={active ? "font-semibold" : ""}>{color.name}</span>
                    {active ? <CheckIcon className="ml-auto size-4 text-accent" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ) : null}

      <label className="flex h-11 cursor-pointer items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={onlyInStock}
          onChange={(event) =>
            applyParams((params) => {
              if (event.target.checked) params.set("inStock", "true");
              else params.delete("inStock");
            })
          }
          className="size-4 cursor-pointer accent-[#c2410c]"
        />
        Solo prendas disponibles
      </label>
    </div>
  );
}
