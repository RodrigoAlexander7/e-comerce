"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";

/**
 * Frontera de error de la tienda.
 *
 * Cubre el caso mas probable en produccion: la API de catalogo no responde.
 * Se ofrece reintentar porque suele ser un fallo transitorio.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Fallo al renderizar la tienda:", error);
  }, [error]);

  return (
    <div className="shell flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="label-caps text-accent">Algo fallo</p>
      <h1 className="font-display mt-6 text-5xl md:text-6xl">No pudimos cargar la tienda</h1>
      <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
        Es posible que el servicio este temporalmente fuera de servicio. Vuelve
        a intentarlo en unos segundos.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Button variant="primary" size="lg" onClick={reset}>
          Reintentar
        </Button>
        <ButtonLink href="/" variant="outline" size="lg">
          Ir al inicio
        </ButtonLink>
      </div>
    </div>
  );
}
