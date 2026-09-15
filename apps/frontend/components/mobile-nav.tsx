"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CloseIcon, MenuIcon } from "@/components/icons";
import type { Category } from "@/lib/api/types";

/**
 * Navegacion desplegable para pantallas estrechas.
 *
 * Es el unico fragmento interactivo de la cabecera, por eso se aisla aqui:
 * asi el resto del encabezado se sigue renderizando en el servidor y no viaja
 * JavaScript innecesario al navegador.
 *
 * El panel se cierra en el propio manejador de cada enlace, no reaccionando a
 * un cambio de ruta desde un efecto: al pulsar ya se sabe que hay que cerrar,
 * y evitarlo ahorra un ciclo de renderizado en cascada por cada navegacion.
 */
export function MobileNav({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);

  // Con el panel abierto el fondo no debe desplazarse.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu de navegacion"
        aria-expanded={open}
        className="grid size-11 cursor-pointer place-items-center text-ink transition-colors hover:bg-mist lg:hidden"
      >
        <MenuIcon className="size-6" />
      </button>

      <div
        hidden={!open}
        className="fixed inset-0 z-50 bg-paper lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Navegacion principal"
      >
        <div className="shell flex h-16 items-center justify-between">
          <span className="font-display text-2xl">Menu</span>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar menu"
            className="grid size-11 cursor-pointer place-items-center text-ink transition-colors hover:bg-mist"
          >
            <CloseIcon className="size-6" />
          </button>
        </div>

        <nav className="shell pt-6">
          <ul className="flex flex-col">
            {categories.map((category) => (
              <li key={category.id} className="border-b border-line">
                <Link
                  href={`/tienda/${category.slug}`}
                  onClick={close}
                  className="font-display flex items-baseline justify-between py-5 text-4xl"
                >
                  {category.name}
                  <span className="label-caps text-ash">{category.productCount}</span>
                </Link>
              </li>
            ))}
            <li className="border-b border-line">
              <Link
                href="/tienda"
                onClick={close}
                className="font-display block py-5 text-4xl"
              >
                Todo el catalogo
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
}
