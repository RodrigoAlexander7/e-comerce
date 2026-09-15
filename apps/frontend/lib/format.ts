/**
 * Formato de importes.
 *
 * El backend transporta centimos enteros; la conversion a unidades ocurre solo
 * al pintar, nunca antes, para que ningun calculo intermedio pase por coma
 * flotante.
 */
const PEN = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

/** Devuelve el importe como "S/ 725.00" con espacio duro entre simbolo y cifra. */
export function formatPrice(cents: number): string {
  return PEN.format(cents / 100);
}

/** Descuento porcentual redondeado, para el distintivo de oferta. */
export function discountPercent(priceCents: number, compareAtCents: number): number {
  return Math.round(((compareAtCents - priceCents) / compareAtCents) * 100);
}
