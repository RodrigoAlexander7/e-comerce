"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui/button";
import { BagIcon, CheckIcon } from "@/components/icons";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart/cart-context";
import type { ProductVariant } from "@/lib/api/types";

/**
 * Selector de color y talla de la ficha de producto.
 *
 * La talla depende del color: un mismo modelo puede estar agotado en negro
 * talla M y disponible en gris. Por eso las tallas se recalculan cada vez que
 * cambia el color, y las combinaciones sin stock se muestran deshabilitadas en
 * lugar de ocultarse: saber que una talla existe pero esta agotada es
 * informacion util para quien compra.
 */
export function VariantSelector({
  variants,
  basePriceCents,
  productName,
  productSlug,
  imageUrl,
}: {
  variants: ProductVariant[];
  basePriceCents: number;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
}) {
  const cart = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const colors = useMemo(() => {
    const seen = new Map<string, string>();
    for (const variant of variants) {
      if (!seen.has(variant.colorName)) seen.set(variant.colorName, variant.colorHex);
    }
    return [...seen].map(([name, hex]) => ({ name, hex }));
  }, [variants]);

  // Arranca en el primer color que tenga alguna talla disponible.
  const [color, setColor] = useState(
    () => variants.find((variant) => variant.available)?.colorName ?? colors[0]?.name ?? "",
  );
  const [size, setSize] = useState<string | null>(null);

  const sizesForColor = useMemo(
    () =>
      variants
        .filter((variant) => variant.colorName === color)
        .sort((a, b) => a.size.localeCompare(b.size)),
    [variants, color],
  );

  const selected = sizesForColor.find((variant) => variant.size === size) ?? null;
  const price = selected?.priceCents ?? basePriceCents;

  function chooseColor(next: string) {
    setColor(next);
    // La talla elegida puede no existir en el color nuevo, asi que se limpia
    // en lugar de arrastrar una seleccion invalida.
    setSize(null);
    setJustAdded(false);
  }

  function addToCart() {
    if (selected === null || !selected.available) return;

    cart.add({
      variantId: selected.id,
      productName,
      productSlug,
      variantLabel: `${selected.size} / ${selected.colorName}`,
      unitPriceCents: selected.priceCents,
      imageUrl,
      maxStock: selected.stock,
    });
    setJustAdded(true);
  }

  return (
    <div className="flex flex-col gap-8">
      <p className="text-2xl font-semibold tabular-nums">{formatPrice(price)}</p>

      <fieldset>
        <legend className="label-caps">
          Color: <span className="text-muted">{color}</span>
        </legend>
        <div className="mt-4 flex flex-wrap gap-3">
          {colors.map((option) => {
            const active = option.name === color;
            return (
              <button
                key={option.name}
                type="button"
                onClick={() => chooseColor(option.name)}
                aria-pressed={active}
                aria-label={`Color ${option.name}`}
                title={option.name}
                className={`grid size-11 cursor-pointer place-items-center border transition-colors ${
                  active ? "border-ink" : "border-line hover:border-ash"
                }`}
              >
                <span
                  aria-hidden
                  className="size-6 rounded-full ring-1 ring-line ring-inset"
                  style={{ backgroundColor: option.hex }}
                />
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <div className="flex items-baseline justify-between">
          <legend className="label-caps">Talla</legend>
          <a href="/ayuda/tallas" className="text-xs text-muted underline hover:text-ink">
            Guia de tallas
          </a>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {sizesForColor.map((variant) => {
            const active = variant.size === size;
            return (
              <button
                key={variant.id}
                type="button"
                disabled={!variant.available}
                onClick={() => {
                  setSize(variant.size);
                  setJustAdded(false);
                }}
                aria-pressed={active}
                className={`h-12 min-w-14 cursor-pointer border px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:border-line disabled:bg-mist disabled:text-ash disabled:line-through ${
                  active ? "border-ink bg-ink text-paper" : "border-line text-ink hover:border-ink"
                }`}
              >
                {variant.size}
              </button>
            );
          })}
        </div>
      </fieldset>

      {selected !== null && selected.stock <= 5 ? (
        <p className="text-sm text-accent" role="status">
          Quedan {selected.stock} {selected.stock === 1 ? "unidad" : "unidades"} de esta talla.
        </p>
      ) : null}

      <div>
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={addToCart}
          disabled={selected === null || !selected.available}
        >
          {justAdded ? <CheckIcon className="size-5" /> : <BagIcon className="size-5" />}
          {selected === null
            ? "Elige una talla"
            : justAdded
              ? "Anadido al carrito"
              : "Anadir al carrito"}
        </Button>

        {justAdded ? (
          <div className="mt-3 flex flex-wrap items-center gap-3" role="status">
            <ButtonLink href="/carrito" variant="outline" size="sm">
              Ver carrito
            </ButtonLink>
            <Link href="/tienda" className="text-sm text-muted underline hover:text-ink">
              Seguir comprando
            </Link>
          </div>
        ) : null}

        {sizesForColor.every((variant) => !variant.available) ? (
          <p className="mt-3 text-sm text-muted" role="status">
            Este color esta agotado en todas las tallas.
          </p>
        ) : null}
      </div>
    </div>
  );
}
