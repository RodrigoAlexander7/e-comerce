/**
 * Tallas admitidas por el catalogo.
 *
 * Copia del enum del dominio del backend (CLOTHING_SIZES en
 * product-variant.entity.ts). Vive duplicado a proposito: es una lista fija
 * que casi nunca cambia, y mantenerla aqui evita una peticion de red solo para
 * poblar un selector.
 */
export const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "UNICA"] as const;
