import { describe, expect, it } from 'vitest';
import { Money } from '../../../../shared/domain/money.js';
import { InvalidValueError } from '../../../../shared/domain/domain-error.js';
import { Product } from '../entities/product.entity.js';
import { ProductVariant } from '../entities/product-variant.entity.js';

function variant(overrides: Partial<ConstructorParameters<typeof ProductVariant>[0]> = {}) {
  return new ProductVariant({
    id: overrides.id ?? 'v1',
    productId: 'p1',
    sku: overrides.sku ?? 'SKU-1',
    size: overrides.size ?? 'M',
    colorName: overrides.colorName ?? 'Negro',
    colorHex: overrides.colorHex ?? '#0A0A0A',
    stock: overrides.stock ?? 5,
    lowStockThreshold: overrides.lowStockThreshold ?? 3,
    price: overrides.price ?? null,
    isActive: overrides.isActive ?? true,
  });
}

function product(variants: ProductVariant[], basePriceCents = 15_900, compareAtCents: number | null = null) {
  return new Product({
    id: 'p1',
    name: 'Casaca Cortavientos',
    slug: 'casaca-cortavientos',
    description: 'Casaca ligera.',
    category: { id: 'c1', name: 'Casacas', slug: 'casacas' },
    basePrice: Money.fromCents(basePriceCents),
    compareAtPrice: compareAtCents === null ? null : Money.fromCents(compareAtCents),
    isActive: true,
    isFeatured: false,
    images: [
      { id: 'i2', url: '/b.jpg', alt: 'b', position: 2 },
      { id: 'i1', url: '/a.jpg', alt: 'a', position: 1 },
    ],
    variants,
    createdAt: new Date('2026-01-01'),
  });
}

describe('ProductVariant', () => {
  it('exige un color hexadecimal valido', () => {
    expect(() => variant({ colorHex: 'negro' })).toThrow(InvalidValueError);
  });

  it('rechaza stock negativo', () => {
    expect(() => variant({ stock: -1 })).toThrow(InvalidValueError);
  });

  it('hereda el precio del producto cuando no tiene uno propio', () => {
    expect(variant().effectivePrice(Money.fromCents(15_900)).cents).toBe(15_900);
  });

  it('usa su precio propio cuando lo tiene', () => {
    const v = variant({ price: Money.fromCents(12_000) });
    expect(v.effectivePrice(Money.fromCents(15_900)).cents).toBe(12_000);
  });

  it('no esta disponible si esta agotada o deshabilitada', () => {
    expect(variant({ stock: 0 }).isAvailable).toBe(false);
    expect(variant({ isActive: false }).isAvailable).toBe(false);
    expect(variant().isAvailable).toBe(true);
  });

  it('avisa de stock bajo solo cuando aun queda mercancia', () => {
    expect(variant({ stock: 2, lowStockThreshold: 3 }).isLowStock).toBe(true);
    expect(variant({ stock: 0, lowStockThreshold: 3 }).isLowStock).toBe(false);
  });

  it('no puede atender un pedido mayor que su stock', () => {
    const v = variant({ stock: 2 });
    expect(v.canFulfill(2)).toBe(true);
    expect(v.canFulfill(3)).toBe(false);
  });
});

describe('Product', () => {
  it('ordena las imagenes por posicion, no por orden de llegada', () => {
    expect(product([variant()]).primaryImage?.url).toBe('/a.jpg');
  });

  it('esta en stock si al menos una variante lo esta', () => {
    const agotadaYDisponible = [variant({ id: 'a', stock: 0 }), variant({ id: 'b', stock: 4 })];
    expect(product(agotadaYDisponible).isInStock).toBe(true);
    expect(product([variant({ stock: 0 })]).isInStock).toBe(false);
  });

  it('lista solo las tallas con existencias, sin repetirlas', () => {
    const p = product([
      variant({ id: 'a', size: 'S', stock: 0 }),
      variant({ id: 'b', size: 'M', colorName: 'Negro' }),
      variant({ id: 'c', size: 'M', colorName: 'Blanco', colorHex: '#FFFFFF' }),
    ]);
    expect(p.availableSizes).toEqual(['M']);
  });

  it('toma el precio mas bajo entre las variantes disponibles', () => {
    const p = product([
      variant({ id: 'a', price: Money.fromCents(20_000) }),
      variant({ id: 'b', price: Money.fromCents(13_500) }),
    ]);
    expect(p.lowestPrice.cents).toBe(13_500);
  });

  it('ignora el precio de las variantes agotadas al calcular el precio desde', () => {
    // Anunciar el precio de una talla agotada seria publicidad enganosa.
    const p = product([
      variant({ id: 'a', price: Money.fromCents(9_900), stock: 0 }),
      variant({ id: 'b', price: Money.fromCents(18_000), stock: 2 }),
    ]);
    expect(p.lowestPrice.cents).toBe(18_000);
  });

  it('solo esta en oferta si el precio anterior es mayor que el actual', () => {
    expect(product([variant()], 15_900, 19_900).isOnSale).toBe(true);
    expect(product([variant()], 15_900, 15_900).isOnSale).toBe(false);
    expect(product([variant()], 15_900, null).isOnSale).toBe(false);
  });

  it('agrupa los colores sin duplicarlos e incluye los agotados', () => {
    const p = product([
      variant({ id: 'a', colorName: 'Negro', colorHex: '#0A0A0A' }),
      variant({ id: 'b', colorName: 'Negro', colorHex: '#0A0A0A', size: 'L' }),
      variant({ id: 'c', colorName: 'Blanco', colorHex: '#FFFFFF', stock: 0 }),
    ]);
    expect(p.colors).toEqual([
      { name: 'Negro', hex: '#0A0A0A' },
      { name: 'Blanco', hex: '#FFFFFF' },
    ]);
  });

  it('suma el stock de todas sus variantes', () => {
    expect(product([variant({ id: 'a', stock: 3 }), variant({ id: 'b', stock: 4 })]).totalStock).toBe(7);
  });
});
