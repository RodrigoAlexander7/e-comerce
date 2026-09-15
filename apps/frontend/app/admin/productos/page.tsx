"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { adminGet } from "@/lib/admin/client";
import { useAdminQuery } from "@/lib/admin/use-admin-query";
import { formatPrice } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";
import { PlusIcon } from "@/components/icons";
import type { AdminProduct, PageResult } from "@/lib/admin/types";

export default function AdminProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(search);

  const fetchProducts = useCallback(
    () => adminGet<PageResult<AdminProduct>>("/admin/products", { search, perPage: "50" }),
    [search],
  );
  const { data: page, error } = useAdminQuery(search, fetchProducts);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">Productos</h1>
        <ButtonLink href="/admin/productos/nuevo" variant="primary" size="sm">
          <PlusIcon className="size-4" />
          Nueva prenda
        </ButtonLink>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          const params = new URLSearchParams(searchParams.toString());
          if (searchInput) params.set("search", searchInput);
          else params.delete("search");
          router.push(`/admin/productos?${params.toString()}`);
        }}
        className="flex max-w-md"
      >
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Buscar por nombre"
          className="h-11 flex-1 border border-line bg-paper px-3 text-sm focus:border-ink"
        />
        <button
          type="submit"
          className="label-caps h-11 cursor-pointer bg-ink px-4 text-paper transition-colors hover:bg-graphite"
        >
          Buscar
        </button>
      </form>

      {error ? <p className="border-l-4 border-danger bg-mist p-4 text-sm text-steel">{error}</p> : null}

      {!page && !error ? (
        <div className="h-64 animate-pulse border border-line bg-mist" aria-label="Cargando productos" />
      ) : null}

      {page ? (
        <div className="overflow-x-auto border border-line bg-paper">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-mist text-xs text-muted">
                <th className="px-4 py-3 font-medium">Prenda</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 text-right font-medium">Precio</th>
                <th className="px-4 py-3 text-right font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {page.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted">
                    No hay prendas que coincidan.
                  </td>
                </tr>
              ) : (
                page.items.map((product) => (
                  <tr key={product.id} className="border-b border-line last:border-0 hover:bg-mist">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/productos/${product.id}`}
                        className="font-medium hover:text-accent"
                      >
                        {product.name}
                      </Link>
                      <p className="text-xs text-muted">{product.variants.length} variantes</p>
                    </td>
                    <td className="px-4 py-3 text-muted">{product.categoryName}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatPrice(product.basePriceCents)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right tabular-nums ${
                        product.totalStock === 0 ? "text-danger" : ""
                      }`}
                    >
                      {product.totalStock}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`label-caps ${product.isActive ? "text-ink" : "text-ash"}`}>
                        {product.isActive ? "Publicada" : "Retirada"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
