import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service.js';
import type { Prisma } from '../../../shared/infrastructure/prisma/generated-client.js';
import { buildPage, toSkipTake, type Page, type PageRequest } from '../../../shared/domain/pagination.js';
import type { Product } from '../domain/entities/product.entity.js';
import { Money } from '../../../shared/domain/money.js';
import { ConflictError, NotFoundError } from '../../../shared/domain/domain-error.js';
import {
  ProductRepository,
  type CreateProductInput,
  type LowStockVariant,
  type ProductFacets,
  type ProductFilter,
  type ProductSort,
  type UpdateProductInput,
  type VariantInput,
  type VariantWithProduct,
} from '../domain/repositories/product.repository.js';
import { PRODUCT_INCLUDE, toDomainProduct, toDomainVariant } from './catalog.mapper.js';

/** Codigo de Prisma para una violacion de restriccion unica (slug o SKU repetidos). */
const UNIQUE_VIOLATION = 'P2002';

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === UNIQUE_VIOLATION
  );
}

/** Traduce el orden del dominio a la clausula ORDER BY de Prisma. */
const SORT_CLAUSE: Record<ProductSort, Prisma.ProductOrderByWithRelationInput> = {
  newest: { createdAt: 'desc' },
  price_asc: { basePriceCents: 'asc' },
  price_desc: { basePriceCents: 'desc' },
  name_asc: { name: 'asc' },
};

/**
 * Implementacion del puerto ProductRepository sobre PostgreSQL.
 *
 * Toda la sintaxis de Prisma queda confinada a esta clase. Es la unica pieza
 * que habria que reescribir para cambiar de motor de base de datos.
 */
@Injectable()
export class PrismaProductRepository extends ProductRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findMany(filter: ProductFilter, page: PageRequest, sort: ProductSort): Promise<Page<Product>> {
    const where = this.buildWhere(filter);
    const { skip, take } = toSkipTake(page);

    // Se lanzan en paralelo: el conteo no depende de la pagina y esperarlos en
    // serie duplicaria la latencia del listado sin ninguna ganancia.
    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        orderBy: SORT_CLAUSE[sort],
        skip,
        take,
      }),
      this.prisma.product.count({ where }),
    ]);

    return buildPage(rows.map(toDomainProduct), total, page);
  }

  async findBySlug(slug: string, includeInactive = false): Promise<Product | null> {
    const row = await this.prisma.product.findFirst({
      where: { slug, ...(includeInactive ? {} : { isActive: true }) },
      include: PRODUCT_INCLUDE,
    });
    return row === null ? null : toDomainProduct(row);
  }

  async findById(id: string, includeInactive = false): Promise<Product | null> {
    const row = await this.prisma.product.findFirst({
      where: { id, ...(includeInactive ? {} : { isActive: true }) },
      include: PRODUCT_INCLUDE,
    });
    return row === null ? null : toDomainProduct(row);
  }

  async findFacets(categorySlug?: string): Promise<ProductFacets> {
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    };

    const [variants, priceRange] = await Promise.all([
      this.prisma.productVariant.findMany({
        where: { isActive: true, product: where },
        select: { size: true, colorName: true, colorHex: true },
      }),
      this.prisma.product.aggregate({
        where,
        _min: { basePriceCents: true },
        _max: { basePriceCents: true },
      }),
    ]);

    const colors = new Map<string, string>();
    for (const variant of variants) {
      if (!colors.has(variant.colorName)) colors.set(variant.colorName, variant.colorHex);
    }

    return {
      sizes: [...new Set(variants.map((variant) => variant.size))].sort(),
      colors: [...colors].map(([name, hex]) => ({ name, hex })),
      minPriceCents: priceRange._min.basePriceCents ?? 0,
      maxPriceCents: priceRange._max.basePriceCents ?? 0,
    };
  }

  async findVariantsByIds(ids: readonly string[]): Promise<VariantWithProduct[]> {
    if (ids.length === 0) return [];

    const rows = await this.prisma.productVariant.findMany({
      // Se consulta por identificador sin filtrar por estado: una variante
      // desactivada debe distinguirse de una inexistente para poder decirle al
      // cliente que la prenda ya no esta disponible, en vez de un error opaco.
      where: { id: { in: [...ids] } },
      include: {
        product: { include: { images: { orderBy: { position: 'asc' }, take: 1 } } },
      },
    });

    return rows.map((row) => ({
      variant: toDomainVariant(row),
      product: {
        id: row.product.id,
        name: row.product.name,
        slug: row.product.slug,
        basePrice: Money.fromCents(row.product.basePriceCents),
        imageUrl: row.product.images[0]?.url ?? null,
        isActive: row.product.isActive,
      },
    }));
  }

  async create(input: CreateProductInput): Promise<Product> {
    try {
      const row = await this.prisma.product.create({
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
          categoryId: input.categoryId,
          basePriceCents: input.basePriceCents,
          compareAtPriceCents: input.compareAtPriceCents ?? null,
          isFeatured: input.isFeatured ?? false,
          images: {
            create: input.images.map((image, index) => ({
              url: image.url,
              alt: image.alt,
              position: index,
            })),
          },
          variants: {
            create: input.variants.map((variant) => this.variantCreateData(variant)),
          },
        },
        include: PRODUCT_INCLUDE,
      });
      return toDomainProduct(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError(
          `Ya existe una prenda con el slug "${input.slug}" o un SKU repetido entre sus variantes.`,
        );
      }
      throw error;
    }
  }

  async update(id: string, patch: UpdateProductInput): Promise<Product> {
    await this.requireProduct(id);

    try {
      const row = await this.prisma.product.update({
        where: { id },
        data: {
          name: patch.name,
          description: patch.description,
          categoryId: patch.categoryId,
          basePriceCents: patch.basePriceCents,
          compareAtPriceCents: patch.compareAtPriceCents,
          isFeatured: patch.isFeatured,
          ...(patch.images
            ? {
                // Se reemplaza la lista entera: son pocas fotos gestionadas
                // desde un formulario, igual que las cuentas bancarias de
                // configuracion de la tienda.
                images: {
                  deleteMany: {},
                  create: patch.images.map((image, index) => ({
                    url: image.url,
                    alt: image.alt,
                    position: index,
                  })),
                },
              }
            : {}),
        },
        include: PRODUCT_INCLUDE,
      });
      return toDomainProduct(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError('El slug o categoria indicados chocan con otra prenda.');
      }
      throw error;
    }
  }

  async setActive(id: string, isActive: boolean): Promise<Product> {
    await this.requireProduct(id);
    const row = await this.prisma.product.update({
      where: { id },
      data: { isActive },
      include: PRODUCT_INCLUDE,
    });
    return toDomainProduct(row);
  }

  async createVariant(productId: string, input: VariantInput): Promise<Product> {
    await this.requireProduct(productId);

    try {
      await this.prisma.productVariant.create({
        data: { productId, ...this.variantCreateData(input) },
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError(
          `El SKU "${input.sku}" ya existe, o esa combinacion de talla y color ya esta registrada.`,
        );
      }
      throw error;
    }

    return this.requireProduct(productId);
  }

  async updateVariant(variantId: string, patch: Partial<VariantInput>): Promise<Product> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { productId: true },
    });
    if (variant === null) throw new NotFoundError('la variante', variantId);

    try {
      await this.prisma.productVariant.update({
        where: { id: variantId },
        data: {
          sku: patch.sku,
          size: patch.size,
          colorName: patch.colorName,
          colorHex: patch.colorHex,
          stock: patch.stock,
          lowStockThreshold: patch.lowStockThreshold,
          priceCents: patch.priceCents,
          isActive: patch.isActive,
        },
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError('Ese SKU, o esa combinacion de talla y color, ya esta en uso.');
      }
      throw error;
    }

    return this.requireProduct(variant.productId);
  }

  async deleteVariant(variantId: string): Promise<Product> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { productId: true },
    });
    if (variant === null) throw new NotFoundError('la variante', variantId);

    // Las ordenes que ya incluyeron esta variante conservan su propia copia
    // (nombre, sku, precio) en OrderItem, y la relacion se desconecta sola por
    // el onDelete: SetNull del esquema: borrar aqui nunca corrompe el historial.
    await this.prisma.productVariant.delete({ where: { id: variantId } });

    return this.requireProduct(variant.productId);
  }

  async findLowStockVariants(limit: number): Promise<LowStockVariant[]> {
    // Comparar dos columnas de la misma fila (stock <= lowStockThreshold) no
    // se expresa con el constructor de filtros de Prisma, que solo compara una
    // columna contra un valor fijo: hace falta SQL crudo. Los parametros van
    // interpolados por el propio $queryRaw, nunca concatenados a mano, asi que
    // no hay riesgo de inyeccion.
    return this.prisma.$queryRaw<LowStockVariant[]>`
      SELECT
        v.id            AS "variantId",
        v.sku           AS "sku",
        v.size          AS "size",
        v."colorName"   AS "colorName",
        v.stock         AS "stock",
        v."lowStockThreshold" AS "lowStockThreshold",
        p.id            AS "productId",
        p.name          AS "productName",
        p.slug          AS "productSlug"
      FROM product_variants v
      JOIN products p ON p.id = v."productId"
      WHERE v."isActive" = true
        AND p."isActive" = true
        AND v.stock <= v."lowStockThreshold"
      ORDER BY v.stock ASC
      LIMIT ${limit}
    `;
  }

  private async requireProduct(id: string): Promise<Product> {
    const row = await this.prisma.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE });
    if (row === null) throw new NotFoundError('la prenda', id);
    return toDomainProduct(row);
  }

  private variantCreateData(input: VariantInput) {
    return {
      sku: input.sku,
      size: input.size,
      colorName: input.colorName,
      colorHex: input.colorHex,
      stock: input.stock,
      lowStockThreshold: input.lowStockThreshold ?? 5,
      priceCents: input.priceCents ?? null,
      isActive: input.isActive ?? true,
    };
  }

  private buildWhere(filter: ProductFilter): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {};

    if (!filter.includeInactive) where.isActive = true;
    if (filter.onlyFeatured) where.isFeatured = true;
    if (filter.categorySlug) where.category = { slug: filter.categorySlug };

    if (filter.search) {
      // Busqueda simple sobre nombre y descripcion. Si el catalogo crece hasta
      // hacerla lenta, el reemplazo natural es un indice de texto completo.
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter.minPriceCents !== undefined || filter.maxPriceCents !== undefined) {
      where.basePriceCents = {
        ...(filter.minPriceCents !== undefined ? { gte: filter.minPriceCents } : {}),
        ...(filter.maxPriceCents !== undefined ? { lte: filter.maxPriceCents } : {}),
      };
    }

    // Talla, color y disponibilidad son propiedades de la variante, no del
    // producto: se traducen a una condicion "existe alguna variante que...".
    const variantConditions: Prisma.ProductVariantWhereInput = { isActive: true };
    let hasVariantCondition = false;

    if (filter.sizes?.length) {
      variantConditions.size = { in: [...filter.sizes] };
      hasVariantCondition = true;
    }
    if (filter.colors?.length) {
      variantConditions.colorName = { in: [...filter.colors] };
      hasVariantCondition = true;
    }
    if (filter.onlyInStock) {
      variantConditions.stock = { gt: 0 };
      hasVariantCondition = true;
    }
    if (hasVariantCondition) {
      where.variants = { some: variantConditions };
    }

    return where;
  }
}
