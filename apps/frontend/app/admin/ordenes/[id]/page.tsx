"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { adminGet, adminPatch } from "@/lib/admin/client";
import { formatPrice } from "@/lib/format";
import { StatusBadge } from "@/components/admin/status-badge";
import { ArrowRightIcon, CheckIcon } from "@/components/icons";
import type { AdminOrder, OrderStatus } from "@/lib/admin/types";

/**
 * Transiciones que el panel ofrece a partir de cada estado.
 *
 * Es una copia de las reglas del dominio (Order.canTransitionTo) solo para
 * pintar opciones sensatas en el selector: la que de verdad se cumple es la
 * del backend, que rechaza cualquier salto que no este aqui aunque alguien
 * manipulara la peticion.
 */
const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Pendiente de pago",
  PAID: "Pagado",
  SHIPPED: "Enviado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justConfirmed, setJustConfirmed] = useState(false);

  function load() {
    adminGet<AdminOrder>(`/admin/orders/${params.id}`)
      .then(setOrder)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "No se pudo cargar la orden."));
  }

  useEffect(load, [params.id]);

  async function submitStatusChange() {
    if (!nextStatus) return;
    setIsSubmitting(true);
    setError(null);
    setJustConfirmed(false);

    try {
      const updated = await adminPatch<AdminOrder>(`/admin/orders/${params.id}/estado`, {
        status: nextStatus,
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      setOrder(updated);
      setNextStatus("");
      setNote("");
      setJustConfirmed(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cambiar el estado.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (error && !order) {
    return <p className="border-l-4 border-danger bg-mist p-4 text-sm text-steel">{error}</p>;
  }

  if (!order) {
    return <div className="h-96 animate-pulse border border-line bg-mist" aria-label="Cargando orden" />;
  }

  const options = NEXT_STATUSES[order.status];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin/ordenes" className="label-caps text-muted hover:text-ink">
            Ordenes
          </Link>
          <h1 className="font-display mt-1 text-3xl">{order.number}</h1>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-6">
          <section className="border border-line bg-paper p-5">
            <h2 className="label-caps text-ash">Cliente</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-muted">Nombre</dt>
                <dd className="mt-0.5 font-medium">{order.customer.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Correo</dt>
                <dd className="mt-0.5 font-medium">{order.customer.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Telefono</dt>
                <dd className="mt-0.5 font-medium">{order.customer.phone}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Identificacion</dt>
                <dd className="mt-0.5 font-medium">
                  {order.customer.idType} {order.customer.idNumber}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Cuenta</dt>
                <dd className="mt-0.5 font-medium">{order.userId ? "Registrada" : "Invitado"}</dd>
              </div>
            </dl>

            {order.invoice ? (
              <div className="mt-4 border-t border-line pt-4 text-sm">
                <p className="text-xs text-muted">Datos de facturacion</p>
                <p className="mt-1 font-medium">
                  {order.invoice.businessName} &middot; RUC {order.invoice.ruc}
                </p>
              </div>
            ) : null}
          </section>

          <section className="border border-line bg-paper p-5">
            <h2 className="label-caps text-ash">Entrega</h2>
            <p className="mt-3 text-sm leading-relaxed">
              {order.shippingAddress.street}
              {order.shippingAddress.apartment ? `, ${order.shippingAddress.apartment}` : ""},{" "}
              {order.shippingAddress.district}, {order.shippingAddress.city}, {order.shippingAddress.state},{" "}
              {order.shippingAddress.country}
            </p>
            <p className="mt-2 text-sm text-muted">{order.shippingMethodName}</p>
          </section>

          <section className="border border-line bg-paper p-5">
            <h2 className="label-caps text-ash">Productos</h2>
            <ul className="mt-4 flex flex-col divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.sku} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-xs text-muted">
                      {item.variantLabel} &middot; {item.sku} &middot; x{item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 font-medium tabular-nums">{formatPrice(item.lineTotalCents)}</p>
                </li>
              ))}
            </ul>

            <dl className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Entrega</dt>
                <dd className="tabular-nums">{formatPrice(order.totals.shippingCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="tabular-nums">{formatPrice(order.totals.subtotalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Impuestos</dt>
                <dd className="tabular-nums">{formatPrice(order.totals.taxCents)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-1.5 text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatPrice(order.totals.totalCents)}</dd>
              </div>
            </dl>
          </section>

          {order.adminNote ? (
            <section className="border border-line bg-paper p-5">
              <h2 className="label-caps text-ash">Nota interna</h2>
              <p className="mt-3 text-sm leading-relaxed text-steel">{order.adminNote}</p>
            </section>
          ) : null}
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-8 lg:self-start">
          <section className="border border-line bg-paper p-5">
            <h2 className="label-caps text-ash">Cambiar estado</h2>

            {options.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                Esta orden esta {STATUS_LABELS[order.status].toLowerCase()} y no admite mas cambios.
              </p>
            ) : (
              <div className="mt-4 flex flex-col gap-4">
                <p className="text-xs leading-relaxed text-muted">
                  Verifica el abono en Yape, Plin o la cuenta bancaria antes de marcar la orden como pagada.
                  {" "}
                  Al pasar a pagado, el cliente recibe un correo de confirmacion automaticamente.
                </p>

                <div className="flex flex-col gap-2">
                  {options.map((option) => (
                    <label
                      key={option}
                      className={`flex cursor-pointer items-center gap-3 border p-3 text-sm transition-colors ${
                        nextStatus === option ? "border-ink bg-canvas" : "border-line hover:border-ash"
                      }`}
                    >
                      <input
                        type="radio"
                        name="nextStatus"
                        checked={nextStatus === option}
                        onChange={() => setNextStatus(option)}
                        className="size-4 cursor-pointer accent-[#c2410c]"
                      />
                      {STATUS_LABELS[option]}
                    </label>
                  ))}
                </div>

                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Nota interna (opcional)"
                  rows={3}
                  className="w-full border border-line bg-paper p-3 text-sm focus:border-ink"
                />

                <button
                  type="button"
                  onClick={submitStatusChange}
                  disabled={!nextStatus || isSubmitting}
                  className="label-caps inline-flex h-12 items-center justify-center gap-2 bg-accent text-paper transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSubmitting ? "Guardando..." : "Confirmar cambio"}
                  <ArrowRightIcon className="size-4" />
                </button>

                {justConfirmed ? (
                  <p className="flex items-center gap-2 text-sm text-accent" role="status">
                    <CheckIcon className="size-4" />
                    Estado actualizado.
                  </p>
                ) : null}

                {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
