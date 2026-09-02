"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";
import { useCartQuote } from "@/lib/checkout/use-cart-quote";
import { formatPrice } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";
import { ArrowRightIcon, CloseIcon } from "@/components/icons";
import { OrderSummary } from "./order-summary";
import { CartIssues } from "./cart-issues";

/**
 * Contenido del carrito.
 *
 * Las lineas se pintan desde el estado local para que la pagina aparezca al
 * instante, pero el total y las incidencias vienen del servidor: es la unica
 * fuente fiable de precio y disponibilidad.
 */
export function CartView() {
  const { lines, isReady, setQuantity, remove } = useCart();
  const { quote, isLoading, error } = useCartQuote();

  if (!isReady) {
    return <div className="h-64 animate-pulse bg-mist" aria-label="Cargando carrito" />;
  }

  if (lines.length === 0) {
    return (
      <div className="border border-line py-24 text-center">
        <p className="font-display text-3xl">Tu carrito esta vacio</p>
        <p className="mt-3 text-sm text-muted">
          Cuando anadas prendas apareceran aqui.
        </p>
        <div className="mt-8">
          <ButtonLink href="/tienda" variant="primary" size="lg">
            Ver catalogo
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_22rem] lg:gap-16">
      <div className="flex flex-col gap-8">
        {quote && quote.issues.length > 0 ? <CartIssues issues={quote.issues} /> : null}

        {error ? (
          <p role="alert" className="border-l-4 border-danger bg-mist p-5 text-sm text-steel">
            {error}
          </p>
        ) : null}

        <ul className="flex flex-col">
          {lines.map((line) => (
            <li
              key={line.variantId}
              className="flex items-start gap-5 border-b border-line py-6 first:border-t"
            >
              <Link
                href={`/producto/${line.productSlug}`}
                className="relative size-24 shrink-0 overflow-hidden bg-mist sm:size-28"
              >
                {line.imageUrl ? (
                  <Image
                    src={line.imageUrl}
                    alt={line.productName}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                ) : null}
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/producto/${line.productSlug}`}
                      className="text-base font-medium leading-snug hover:text-accent"
                    >
                      {line.productName}
                    </Link>
                    <p className="mt-1 text-sm text-muted">{line.variantLabel}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(line.variantId)}
                    aria-label={`Quitar ${line.productName} del carrito`}
                    className="grid size-11 shrink-0 cursor-pointer place-items-center text-muted transition-colors hover:text-danger"
                  >
                    <CloseIcon className="size-4" />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center border border-line">
                    <button
                      type="button"
                      onClick={() => setQuantity(line.variantId, line.quantity - 1)}
                      aria-label="Reducir cantidad"
                      className="grid size-11 cursor-pointer place-items-center text-lg transition-colors hover:bg-mist"
                    >
                      &minus;
                    </button>
                    <span
                      aria-live="polite"
                      className="grid w-10 place-items-center text-sm font-medium tabular-nums"
                    >
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                      disabled={line.quantity >= line.maxStock}
                      aria-label="Aumentar cantidad"
                      className="grid size-11 cursor-pointer place-items-center text-lg transition-colors hover:bg-mist disabled:cursor-not-allowed disabled:text-ash"
                    >
                      +
                    </button>
                  </div>

                  <p className="text-base font-semibold tabular-nums">
                    {formatPrice(line.unitPriceCents * line.quantity)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div>
          <Link
            href="/tienda"
            className="label-caps inline-flex items-center gap-2 text-muted transition-colors hover:text-ink"
          >
            Seguir comprando
          </Link>
        </div>
      </div>

      {quote ? (
        <OrderSummary items={quote.items} totals={quote.totals} shippingLabel="-">
          <ButtonLink
            href="/checkout"
            variant="primary"
            size="lg"
            className="w-full"
            aria-disabled={isLoading}
          >
            Continuar
            <ArrowRightIcon className="size-4" />
          </ButtonLink>
        </OrderSummary>
      ) : (
        <div className="h-64 animate-pulse border border-line bg-mist" />
      )}
    </div>
  );
}
