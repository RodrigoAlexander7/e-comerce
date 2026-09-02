import Image from "next/image";
import Link from "next/link";
import { discountPercent, formatPrice } from "@/lib/format";
import type { ProductSummary } from "@/lib/api/types";

/**
 * Tarjeta de prenda del listado.
 *
 * La imagen manda: ocupa una proporcion 4:5 vertical, como en el retail de
 * moda, y el texto se reduce a lo que decide una compra (nombre, precio,
 * colores). El enlace envuelve toda la tarjeta para dar un area de pulsacion
 * amplia en movil.
 */
export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductSummary;
  priority?: boolean;
}) {
  const discount =
    product.compareAtPriceCents !== null && product.isOnSale
      ? discountPercent(product.priceCents, product.compareAtPriceCents)
      : null;

  return (
    <article className="group">
      <Link href={`/producto/${product.slug}`} className="block">
        <div className="relative aspect-4/5 overflow-hidden bg-mist">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.imageAlt}
              fill
              // Tres columnas en escritorio, dos en tableta, una en movil.
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              priority={priority}
              className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.03]"
            />
          ) : null}

          {discount !== null ? (
            <span className="label-caps absolute left-0 top-4 bg-accent px-3 py-1.5 text-paper">
              -{discount}%
            </span>
          ) : null}

          {!product.inStock ? (
            <span className="label-caps absolute left-0 top-4 bg-ink px-3 py-1.5 text-paper">
              Agotado
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="label-caps text-ash">{product.categoryName}</p>
            <h3 className="mt-1 text-base font-medium leading-snug">{product.name}</h3>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-base font-semibold tabular-nums">
              {formatPrice(product.priceCents)}
            </p>
            {product.compareAtPriceCents !== null && product.isOnSale ? (
              <p className="text-sm text-ash line-through tabular-nums">
                {formatPrice(product.compareAtPriceCents)}
              </p>
            ) : null}
          </div>
        </div>
      </Link>

      {product.colors.length > 0 ? (
        <ul className="mt-3 flex items-center gap-2" aria-label="Colores disponibles">
          {product.colors.map((color) => (
            <li
              key={color.name}
              title={color.name}
              // El nombre viaja como texto accesible porque el color por si
              // solo no comunica nada a un lector de pantalla.
              className="size-3.5 rounded-full ring-1 ring-line ring-inset"
              style={{ backgroundColor: color.hex }}
            >
              <span className="sr-only">{color.name}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
