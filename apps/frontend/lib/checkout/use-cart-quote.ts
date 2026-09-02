"use client";

import { useCallback, useEffect, useState } from "react";
import { quoteCart } from "@/lib/api/checkout";
import { useCart } from "@/lib/cart/cart-context";
import type { CartQuote } from "@/lib/api/types";

interface UseCartQuoteResult {
  quote: CartQuote | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/** Resultado ya resuelto, junto a la peticion exacta que lo produjo. */
interface Resolved {
  key: string;
  quote: CartQuote | null;
  error: string | null;
}

/**
 * Tasa el carrito contra el servidor.
 *
 * Se vuelve a pedir cada vez que cambian las lineas o el metodo de entrega,
 * porque entre un paso y otro del checkout puede agotarse una talla o cambiar
 * un precio, y el cliente debe pagar lo que vale ahora, no lo que valia cuando
 * anadio la prenda.
 *
 * "Cargando" no se guarda en el estado: se deduce comparando la peticion que
 * corresponde al carrito actual con la ultima que llego. Asi el efecto solo
 * escribe estado desde sus callbacks asincronas, sin renderizados en cascada.
 */
export function useCartQuote(shippingMethodId?: string): UseCartQuoteResult {
  const { lines, isReady } = useCart();
  const [resolved, setResolved] = useState<Resolved | null>(null);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((value) => value + 1), []);

  // Clave estable de la peticion: evita relanzarla en cada renderizado por
  // recibir un array nuevo con el mismo contenido.
  const linesKey = lines.map((line) => `${line.variantId}:${line.quantity}`).join("|");
  const isEmpty = linesKey === "";
  const requestKey = `${linesKey}#${shippingMethodId ?? ""}#${nonce}`;

  useEffect(() => {
    // Un carrito vacio no necesita servidor; su resultado se deriva abajo.
    if (!isReady || isEmpty) return;

    // Si el usuario cambia de metodo de entrega mientras vuela una peticion,
    // la respuesta vieja no debe sobrescribir a la nueva.
    let cancelled = false;

    quoteCart(
      linesKey.split("|").map((entry) => {
        const [variantId, quantity] = entry.split(":");
        return { variantId, quantity: Number(quantity) };
      }),
      shippingMethodId,
    )
      .then((quote) => {
        if (!cancelled) setResolved({ key: requestKey, quote, error: null });
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setResolved({
          key: requestKey,
          quote: null,
          error:
            cause instanceof Error
              ? cause.message
              : "No pudimos calcular el total de tu carrito.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [requestKey, linesKey, isEmpty, shippingMethodId, isReady]);

  if (isEmpty) {
    return { quote: null, error: null, isLoading: !isReady, refresh };
  }

  const isCurrent = resolved !== null && resolved.key === requestKey;

  return {
    // Mientras llega la peticion nueva se conserva la anterior en pantalla:
    // vaciar el resumen a cada cambio de envio produciria un parpadeo.
    quote: resolved?.quote ?? null,
    error: isCurrent ? resolved.error : null,
    isLoading: !isCurrent,
    refresh,
  };
}
