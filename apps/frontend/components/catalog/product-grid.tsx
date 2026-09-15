import { ProductCard } from "./product-card";
import type { ProductSummary } from "@/lib/api/types";

export function ProductGrid({ products }: { products: ProductSummary[] }) {
  if (products.length === 0) {
    return (
      <div className="border border-line py-24 text-center">
        <p className="font-display text-3xl">Sin resultados</p>
        <p className="mt-3 text-sm text-muted">
          Prueba a quitar algun filtro o a buscar con otras palabras.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          // Solo la primera fila entra en la carga prioritaria: marcar todas
          // las imagenes como prioritarias equivale a no priorizar ninguna.
          priority={index < 3}
        />
      ))}
    </div>
  );
}
