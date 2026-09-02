"use client";

import Link from "next/link";
import { BagIcon } from "@/components/icons";
import { useCart } from "@/lib/cart/cart-context";

/**
 * Acceso al carrito con contador.
 *
 * El contador solo aparece cuando el carrito ya se leyo del navegador: pintar
 * un cero antes de saberlo haria parpadear la cifra en cada carga.
 */
export function CartButton() {
  const { itemCount, isReady } = useCart();
  const showCount = isReady && itemCount > 0;

  return (
    <Link
      href="/carrito"
      aria-label={
        showCount
          ? `Ver carrito, ${itemCount} ${itemCount === 1 ? "articulo" : "articulos"}`
          : "Ver carrito"
      }
      className="relative grid size-11 place-items-center text-ink transition-colors hover:bg-mist"
    >
      <BagIcon className="size-5" />
      {showCount ? (
        <span
          aria-hidden
          className="absolute right-1 top-1 grid min-w-4.5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-4.5 text-paper tabular-nums"
        >
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      ) : null}
    </Link>
  );
}
