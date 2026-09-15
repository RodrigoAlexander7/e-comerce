import { describe, expect, it } from 'vitest';
import { Money } from '../../../../shared/domain/money.js';
import { ProductVariant } from '../../../catalog/domain/entities/product-variant.entity.js';
import type {
  ProductRepository,
  VariantWithProduct,
} from '../../../catalog/domain/repositories/product.repository.js';
import { EmptyCartError } from '../../domain/errors.js';
import { CartResolver } from '../cart-resolver.service.js';

/**
 * Doble del catalogo. Solo implementa la consulta que usa el resolutor: el
 * resto del puerto no interviene aqui y fingirlo entero seria ruido.
 */
function fakeCatalog(entries: VariantWithProduct[]): ProductRepository {
  return {
    async findVariantsByIds(ids: readonly string[]) {
      return entries.filter((entry) => ids.includes(entry.variant.id));
    },
  } as ProductRepository;
}

function entry(options: {
  id: string;
  stock: number;
  priceCents?: number | null;
  basePriceCents?: number;
  variantActive?: boolean;
  productActive?: boolean;
}): VariantWithProduct {
  return {
    variant: new ProductVariant({
      id: options.id,
      productId: 'p1',
      sku: `SKU-${options.id}`,
      size: 'M',
      colorName: 'Negro',
      colorHex: '#0A0A0A',
      stock: options.stock,
      lowStockThreshold: 3,
      price: options.priceCents == null ? null : Money.fromCents(options.priceCents),
      isActive: options.variantActive ?? true,
    }),
    product: {
      id: 'p1',
      name: 'Casaca Cortavientos Ridge',
      slug: 'casaca-cortavientos-ridge',
      basePrice: Money.fromCents(options.basePriceCents ?? 24_900),
      imageUrl: '/products/casaca.svg',
      isActive: options.productActive ?? true,
    },
  };
}

describe('CartResolver', () => {
  it('rechaza un carrito vacio', async () => {
    const resolver = new CartResolver(fakeCatalog([]));
    await expect(resolver.resolve([])).rejects.toThrow(EmptyCartError);
  });

  it('toma el precio del catalogo e ignora cualquier importe del cliente', async () => {
    // El navegador solo manda identificador y cantidad; el precio se relee.
    const resolver = new CartResolver(fakeCatalog([entry({ id: 'v1', stock: 5 })]));
    const { items } = await resolver.resolve([{ variantId: 'v1', quantity: 2 }]);

    expect(items).toHaveLength(1);
    expect(items[0].unitPrice.cents).toBe(24_900);
    expect(items[0].lineTotal.cents).toBe(49_800);
  });

  it('prefiere el precio propio de la variante sobre el de la prenda', async () => {
    const resolver = new CartResolver(
      fakeCatalog([entry({ id: 'v1', stock: 5, priceCents: 19_900 })]),
    );
    const { items } = await resolver.resolve([{ variantId: 'v1', quantity: 1 }]);
    expect(items[0].unitPrice.cents).toBe(19_900);
  });

  it('suma las lineas repetidas de la misma variante antes de mirar el stock', async () => {
    // Enviar dos veces la misma variante no debe eludir la comprobacion.
    const resolver = new CartResolver(fakeCatalog([entry({ id: 'v1', stock: 3 })]));
    const { items, issues } = await resolver.resolve([
      { variantId: 'v1', quantity: 2 },
      { variantId: 'v1', quantity: 2 },
    ]);

    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3);
    expect(issues[0].kind).toBe('INSUFFICIENT_STOCK');
  });

  it('recorta a lo disponible en vez de perder la linea entera', async () => {
    const resolver = new CartResolver(fakeCatalog([entry({ id: 'v1', stock: 2 })]));
    const { items, issues } = await resolver.resolve([{ variantId: 'v1', quantity: 5 }]);

    expect(items[0].quantity).toBe(2);
    expect(issues).toHaveLength(1);
    expect(issues[0].available).toBe(2);
  });

  it('descarta la linea cuando la variante esta agotada', async () => {
    const resolver = new CartResolver(fakeCatalog([entry({ id: 'v1', stock: 0 })]));
    const { items, issues } = await resolver.resolve([{ variantId: 'v1', quantity: 1 }]);

    expect(items).toHaveLength(0);
    expect(issues[0].kind).toBe('INSUFFICIENT_STOCK');
  });

  it('marca como no disponible una variante o prenda desactivada', async () => {
    const resolver = new CartResolver(
      fakeCatalog([
        entry({ id: 'v1', stock: 5, variantActive: false }),
        entry({ id: 'v2', stock: 5, productActive: false }),
      ]),
    );
    const { items, issues } = await resolver.resolve([
      { variantId: 'v1', quantity: 1 },
      { variantId: 'v2', quantity: 1 },
    ]);

    expect(items).toHaveLength(0);
    expect(issues.map((issue) => issue.kind)).toEqual(['UNAVAILABLE', 'UNAVAILABLE']);
  });

  it('informa de una variante inexistente sin romper el resto del carrito', async () => {
    const resolver = new CartResolver(fakeCatalog([entry({ id: 'v1', stock: 5 })]));
    const { items, issues } = await resolver.resolve([
      { variantId: 'v1', quantity: 1 },
      { variantId: 'fantasma', quantity: 1 },
    ]);

    expect(items).toHaveLength(1);
    expect(issues).toHaveLength(1);
    expect(issues[0].variantId).toBe('fantasma');
  });

  it('acumula todas las incidencias en una sola pasada', async () => {
    // El cliente debe verlas todas de golpe, no una por intento.
    const resolver = new CartResolver(
      fakeCatalog([
        entry({ id: 'v1', stock: 0 }),
        entry({ id: 'v2', stock: 1 }),
        entry({ id: 'v3', stock: 5, variantActive: false }),
      ]),
    );
    const { issues } = await resolver.resolve([
      { variantId: 'v1', quantity: 1 },
      { variantId: 'v2', quantity: 4 },
      { variantId: 'v3', quantity: 1 },
    ]);

    expect(issues).toHaveLength(3);
  });
});
