"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminGet } from "@/lib/admin/client";
import { formatPrice } from "@/lib/format";
import { MetricCard } from "@/components/admin/metric-card";
import { AlertIcon } from "@/components/icons";
import type { DashboardMetrics } from "@/lib/admin/types";

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Pendiente de pago",
  PAID: "Pagado",
  SHIPPED: "Enviado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminGet<DashboardMetrics>("/admin/dashboard")
      .then((data) => {
        if (!cancelled) setMetrics(data);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "No se pudo cargar el panel.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p className="border-l-4 border-danger bg-mist p-4 text-sm text-steel">{error}</p>;
  }

  if (!metrics) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true" aria-label="Cargando panel">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 animate-pulse border border-line bg-mist" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl">Panel</h1>
        <p className="mt-1 text-sm text-muted">Resumen del estado actual de la tienda.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Ventas del mes" value={formatPrice(metrics.monthlySalesCents)} />
        <MetricCard
          label="Por verificar pago"
          value={metrics.pendingVerificationCount}
          accent={metrics.pendingVerificationCount > 0}
          detail={
            <Link href="/admin/ordenes?status=PENDING_PAYMENT" className="underline hover:text-ink">
              Ver ordenes pendientes
            </Link>
          }
        />
        <MetricCard
          label="Plazo de pago vencido"
          value={metrics.overduePendingCount}
          accent={metrics.overduePendingCount > 0}
        />
        <MetricCard label="Variantes con stock bajo" value={metrics.lowStockVariants.length} />
      </div>

      <section className="border border-line bg-paper p-5">
        <h2 className="label-caps text-ash">Ordenes por estado</h2>
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {Object.entries(metrics.ordersByStatus).map(([status, count]) => (
            <div key={status}>
              <dt className="text-xs text-muted">{STATUS_LABELS[status] ?? status}</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">{count}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border border-line bg-paper p-5">
        <div className="flex items-center gap-2">
          <AlertIcon className="size-4 text-accent" />
          <h2 className="label-caps text-ash">Alertas de stock bajo</h2>
        </div>

        {metrics.lowStockVariants.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No hay variantes con stock bajo en este momento.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-muted">
                  <th className="py-2 font-medium">Prenda</th>
                  <th className="py-2 font-medium">Variante</th>
                  <th className="py-2 font-medium">SKU</th>
                  <th className="py-2 text-right font-medium">Stock</th>
                  <th className="py-2 text-right font-medium">Umbral</th>
                </tr>
              </thead>
              <tbody>
                {metrics.lowStockVariants.map((variant) => (
                  <tr key={variant.variantId} className="border-b border-line last:border-0">
                    <td className="py-2.5">
                      <Link
                        href={`/admin/productos/${variant.productId}`}
                        className="font-medium hover:text-accent"
                      >
                        {variant.productName}
                      </Link>
                    </td>
                    <td className="py-2.5 text-muted">
                      {variant.size} / {variant.colorName}
                    </td>
                    <td className="py-2.5 font-mono text-xs text-muted">{variant.sku}</td>
                    <td
                      className={`py-2.5 text-right tabular-nums font-semibold ${
                        variant.stock === 0 ? "text-danger" : "text-accent"
                      }`}
                    >
                      {variant.stock}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-muted">{variant.lowStockThreshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
