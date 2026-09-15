import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../../auth/presentation/decorators/roles.decorator.js';
import { ListProductsUseCase } from '../application/use-cases/list-products.use-case.js';
import { GetProductBySlugUseCase } from '../application/use-cases/get-product-by-slug.use-case.js';
import { GetProductFacetsUseCase } from '../application/use-cases/get-product-facets.use-case.js';
import type { ProductFacets } from '../domain/repositories/product.repository.js';
import { ListProductsQuery } from './dto/list-products.query.js';
import {
  toPageView,
  toProductDetailView,
  toProductSummaryView,
  type PageView,
  type ProductDetailView,
  type ProductSummaryView,
} from './product.view-model.js';

const DEFAULT_PER_PAGE = 12;

/**
 * Superficie HTTP del catalogo publico.
 *
 * El controlador solo traduce: valida la entrada, delega en un caso de uso y
 * serializa la salida. Ninguna regla de negocio vive aqui.
 */
@Public()
@Controller('catalog/products')
export class ProductsController {
  constructor(
    private readonly listProducts: ListProductsUseCase,
    private readonly getProductBySlug: GetProductBySlugUseCase,
    private readonly getFacets: GetProductFacetsUseCase,
  ) {}

  @Get()
  async list(@Query() query: ListProductsQuery): Promise<PageView<ProductSummaryView>> {
    const page = await this.listProducts.execute({
      filter: {
        categorySlug: query.category,
        search: query.search,
        sizes: query.sizes,
        colors: query.colors,
        minPriceCents: query.minPrice,
        maxPriceCents: query.maxPrice,
        onlyInStock: query.inStock === 'true',
        onlyFeatured: query.featured === 'true',
      },
      page: { page: query.page ?? 1, perPage: query.perPage ?? DEFAULT_PER_PAGE },
      sort: query.sort ?? 'newest',
    });

    return toPageView(page, toProductSummaryView);
  }

  @Get('facets')
  facets(@Query('category') category?: string): Promise<ProductFacets> {
    return this.getFacets.execute(category);
  }

  @Get(':slug')
  async detail(@Param('slug') slug: string): Promise<ProductDetailView> {
    const product = await this.getProductBySlug.execute(slug);
    return toProductDetailView(product);
  }
}
