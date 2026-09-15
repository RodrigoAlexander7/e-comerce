"use client";

import { useEffect, useState } from "react";

interface Resolved<T> {
  key: string;
  data: T | null;
  error: string | null;
}

/**
 * Peticion GET del panel que depende de una clave (filtros, id de ruta...).
 *
 * "Cargando" se deriva comparando la clave de la peticion en curso con la de
 * la ultima que se resolvio, en vez de guardarse en su propio estado: fijar
 * un "cargando = true" al inicio del efecto violaria la regla de no llamar a
 * setState de forma sincrona dentro de un efecto (ver use-cart-quote.ts, que
 * usa el mismo patron para el carrito de la tienda).
 */
export function useAdminQuery<T>(key: string, fetcher: () => Promise<T>): {
  data: T | null;
  error: string | null;
  isLoading: boolean;
} {
  const [resolved, setResolved] = useState<Resolved<T> | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetcher()
      .then((data) => {
        if (!cancelled) setResolved({ key, data, error: null });
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setResolved({
            key,
            data: null,
            error: cause instanceof Error ? cause.message : "No se pudo completar la peticion.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
    // Deliberado: la peticion se vuelve a lanzar solo cuando cambia la clave,
    // no cuando cambia la identidad de la funcion fetcher entre renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const isCurrent = resolved?.key === key;
  return {
    data: isCurrent ? resolved.data : null,
    error: isCurrent ? resolved.error : null,
    isLoading: !isCurrent,
  };
}
