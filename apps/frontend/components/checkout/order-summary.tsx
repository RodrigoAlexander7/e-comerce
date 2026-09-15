import Image from "next/image";
import { formatPrice } from "@/lib/format";
import type { CartLineView, Totals } from "@/lib/api/types";

/**
 * Resumen del pedido que acompana a los tres pasos del checkout.
 *
 * Muestra siempre las cifras que devuelve el servidor, no las guardadas en el
 * navegador: es la unica manera de que lo que ve el cliente coincida con lo que
 * se va a cobrar.
 */
export function OrderSummary({
  items,
  totals,
  shippingLabel,
  children,
}: {
  items: CartLineView[];
  totals: Totals;
  /** Guion mientras no se ha elegido metodo de entrega. */
  shippingLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <aside className="border border-line bg-paper p-6 lg:sticky lg:top-28 lg:self-start">
      <h2 className="sr-only">Resumen del pedido</h2>

      <ul className="flex flex-col gap-5">
        {items.map((item) => (
          <li key={item.sku} className="flex items-start gap-4">
            <div className="relative size-16 shrink-0 overflow-hidden bg-mist">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt="" fill sizes="64px" className="object-cover" />
              ) : null}
              <span
                aria-hidden
                className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-accent text-[10px] font-bold text-paper tabular-nums"
              >
                {item.quantity}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug">{item.productName}</p>
              <p className="mt-0.5 text-xs text-muted">{item.variantLabel}</p>
            </div>

            <p className="shrink-0 text-sm font-medium tabular-nums">
              {formatPrice(item.lineTotalCents)}
            </p>
          </li>
        ))}
      </ul>

      <dl className="mt-6 flex flex-col gap-2 border-t border-line pt-6 text-sm">
        <div className="flex items-baseline justify-between">
          <dt className="text-muted">Entrega</dt>
          <dd className="tabular-nums">
            {shippingLabel ?? formatPrice(totals.shippingCents)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between">
          <dt className="text-muted">Subtotal</dt>
          <dd className="tabular-nums">{formatPrice(totals.subtotalCents)}</dd>
        </div>
        <div className="flex items-baseline justify-between">
          <dt className="text-muted">Impuestos</dt>
          <dd className="tabular-nums">{formatPrice(totals.taxCents)}</dd>
        </div>
        <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
          <dt className="font-display text-xl">Total</dt>
          <dd className="text-lg font-bold tabular-nums">{formatPrice(totals.totalCents)}</dd>
        </div>
      </dl>

      {children ? <div className="mt-6">{children}</div> : null}
    </aside>
  );
}
