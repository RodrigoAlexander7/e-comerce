import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Roles } from '../../auth/presentation/decorators/roles.decorator.js';
import { NotFoundError } from '../../../shared/domain/domain-error.js';
import { slugify } from '../domain/slug.js';
import { ListProductsAdminUseCase } from '../application/use-cases/admin/list-products-admin.use-case.js';
import { CreateProductUseCase } from '../application/use-cases/admin/create-product.use-case.js';
import { UpdateProductUseCase } from '../application/use-cases/admin/update-product.use-case.js';
import { SetProductActiveUseCase } from '../application/use-cases/admin/set-product-active.use-case.js';
import {
  CreateVariantUseCase,
  DeleteVariantUseCase,
  UpdateVariantUseCase,
} from '../application/use-cases/admin/manage-variant.use-case.js';
import { ProductRepository } from '../domain/repositories/product.repository.js';
import { SetActiveDto } from '../../../shared/presentation/dto/set-active.dto.js';
import { CreateProductDto, CreateVariantDto, UpdateProductDto, UpdateVariantDto } from './dto/admin-product.dto.js';
import { toAdminProductView, type AdminProductView } from './admin-product.view-model.js';
import { toPageView, type PageView } from './product.view-model.js';

/**
 * CRUD de catalogo del panel de administracion.
 *
 * A diferencia de ProductsController (publico), este ve prendas deshabilitadas
 * y expone campos operativos (stock exacto, umbral de aviso, estado).
 */
@Roles('ADMIN')
@Controller('admin/products')
export class AdminProductsController {
  constructor(
    private readonly listProductsAdmin: ListProductsAdminUseCase,
    private readonly createProduct: CreateProductUseCase,
    private readonly updateProduct: UpdateProductUseCase,
    private readonly setProductActive: SetProductActiveUseCase,
    private readonly createVariant: CreateVariantUseCase,
    private readonly updateVariant: UpdateVariantUseCase,
    private readonly deleteVariant: DeleteVariantUseCase,
    private readonly products: ProductRepository,
  ) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ): Promise<PageView<AdminProductView>> {
    const result = await this.listProductsAdmin.execute({
      filter: { search, categorySlug: category },
      page: { page: Number.parseInt(page ?? '1', 10) || 1, perPage: Math.min(Number.parseInt(perPage ?? '20', 10) || 20, 100) },
      sort: 'newest',
    });
    return toPageView(result, toAdminProductView);
  }

  @Get(':id')
  async detail(@Param('id') id: string): Promise<AdminProductView> {
    // includeInactive: true porque el panel necesita poder abrir y reactivar
    // una prenda que ya esta retirada de la tienda.
    const product = await this.products.findById(id, true);
    if (product === null) throw new NotFoundError('la prenda', id);
    return toAdminProductView(product);
  }

  @Post()
  async create(@Body() dto: CreateProductDto): Promise<AdminProductView> {
    const product = await this.createProduct.execute({
      name: dto.name,
      slug: dto.slug?.trim() || slugify(dto.name),
      description: dto.description,
      categoryId: dto.categoryId,
      basePriceCents: dto.basePriceCents,
      compareAtPriceCents: dto.compareAtPriceCents ?? null,
      isFeatured: dto.isFeatured ?? false,
      images: dto.images,
      variants: dto.variants.map((variant) => ({
        sku: variant.sku ?? autoSku(dto.name, variant.size, variant.colorName),
        size: variant.size,
        colorName: variant.colorName,
        colorHex: variant.colorHex,
        stock: variant.stock,
        lowStockThreshold: variant.lowStockThreshold,
        priceCents: variant.priceCents,
        isActive: variant.isActive,
      })),
    });
    return toAdminProductView(product);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto): Promise<AdminProductView> {
    const product = await this.updateProduct.execute(id, dto);
    return toAdminProductView(product);
  }

  @Patch(':id/activo')
  async setActive(@Param('id') id: string, @Body() dto: SetActiveDto): Promise<AdminProductView> {
    const product = await this.setProductActive.execute(id, dto.isActive);
    return toAdminProductView(product);
  }

  @Post(':id/variantes')
  async addVariant(
    @Param('id') id: string,
    @Body() dto: CreateVariantDto,
  ): Promise<AdminProductView> {
    let sku = dto.sku;
    if (!sku) {
      const product = await this.products.findById(id, true);
      if (product === null) throw new NotFoundError('la prenda', id);
      sku = autoSku(product.name, dto.size, dto.colorName);
    }

    const product = await this.createVariant.execute(id, {
      sku,
      size: dto.size,
      colorName: dto.colorName,
      colorHex: dto.colorHex,
      stock: dto.stock,
      lowStockThreshold: dto.lowStockThreshold,
      priceCents: dto.priceCents,
      isActive: dto.isActive,
    });
    return toAdminProductView(product);
  }

  @Patch('variantes/:variantId')
  async patchVariant(
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto,
  ): Promise<AdminProductView> {
    const product = await this.updateVariant.execute(variantId, dto);
    return toAdminProductView(product);
  }

  @Delete('variantes/:variantId')
  async removeVariant(@Param('variantId') variantId: string): Promise<AdminProductView> {
    const product = await this.deleteVariant.execute(variantId);
    return toAdminProductView(product);
  }
}

/** SKU generado cuando el panel no escribe uno a mano. */
function autoSku(seed: string, size: string, colorName: string): string {
  const base = slugify(seed).split('-').slice(0, 3).join('').toUpperCase();
  const color = slugify(colorName).slice(0, 3).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}-${color}-${size}-${suffix}`;
}
