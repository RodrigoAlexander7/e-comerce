"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { adminGet } from "@/lib/admin/client";
import { useAdminQuery } from "@/lib/admin/use-admin-query";
import { formatPrice } from "@/lib/format";
import { StatusBadge } from "@/components/admin/status-badge";
import type { AdminOrderSummary, OrderStatus, PageResult } from "@/lib/admin/types";

const STATUSES: { value: OrderStatus | ""; label: string }[] = [
  { value: "", label: "Todos los estados" },
  { value: "PENDING_PAYMENT", label: "Pendiente de pago" },
  { value: "PAID", label: "Pagado" },
  { value: "SHIPPED", label: "Enviado" },
  { value: "COMPLETED", label: "Completado" },
  { value: "CANCELLED", label: "Cancelado" },
];

/**
 * Listado de ordenes con filtro por estado y busqueda.
 *
 * El estado del filtro vive en la URL (igual que en el listado del catalogo
 * publico): asi un enlace a "solo pendientes de pago" desde el panel principal
 * llega ya filtrado, y recargar la pagina no pierde el filtro elegido.
 */
export default function AdminOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "";
  const search = searchParams.get("search") ?? "";

  const [searchInput, setSearchInput] = useState(search);

  const fetchOrders = useCallback(
    () => adminGet<PageResult<AdminOrderSummary>>("/admin/orders", { status, search }),
    [status, search],
  );
  const { data: page, error } = useAdminQuery(`${status}#${search}`, fetchOrders);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/admin/ordenes?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">Ordenes</h1>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(event) => updateParam("status", event.target.value)}
          className="h-11 cursor-pointer border border-line bg-paper px-3 text-sm focus:border-ink"
        >
          {STATUSES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            updateParam("search", searchInput);
          }}
          className="flex"
        >
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Numero, nombre o correo"
            className="h-11 w-64 border border-line bg-paper px-3 text-sm focus:border-ink"
          />
          <button
            type="submit"
            className="label-caps h-11 cursor-pointer bg-ink px-4 text-paper transition-colors hover:bg-graphite"
          >
            Buscar
          </button>
        </form>
      </div>

      {error ? <p className="border-l-4 border-danger bg-mist p-4 text-sm text-steel">{error}</p> : null}

      {!page && !error ? (
        <div className="h-64 animate-pulse border border-line bg-mist" aria-label="Cargando ordenes" />
      ) : null}

      {page ? (
        <div className="overflow-x-auto border border-line bg-paper">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-mist text-xs text-muted">
                <th className="px-4 py-3 font-medium">Orden</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Pago</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {page.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted">
                    No hay ordenes que coincidan con el filtro.
                  </td>
                </tr>
              ) : (
                page.items.map((order) => (
                  <tr key={order.id} className="border-b border-line last:border-0 hover:bg-mist">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/ordenes/${order.id}`}
                        className="font-medium tabular-nums hover:text-accent"
                      >
                        {order.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-xs text-muted">{order.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {order.paymentMethod === "YAPE_PLIN" ? "Yape / Plin" : "Transferencia"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {formatPrice(order.totalCents)}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(order.createdAt).toLocaleDateString("es-PE")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {page && page.totalPages > 1 ? (
        <div className="flex items-center gap-2 text-sm text-muted">
          Pagina {page.page} de {page.totalPages} &middot; {page.total} ordenes
        </div>
      ) : null}
    </div>
  );
}
