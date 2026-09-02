import { Module } from '@nestjs/common';
import { ProductRepository } from './domain/repositories/product.repository.js';
import { CategoryRepository } from './domain/repositories/category.repository.js';
import { PrismaProductRepository } from './infrastructure/prisma-product.repository.js';
import { PrismaCategoryRepository } from './infrastructure/prisma-category.repository.js';
import { ListProductsUseCase } from './application/use-cases/list-products.use-case.js';
import { GetProductBySlugUseCase } from './application/use-cases/get-product-by-slug.use-case.js';
import { GetProductFacetsUseCase } from './application/use-cases/get-product-facets.use-case.js';
import { ListCategoriesUseCase } from './application/use-cases/list-categories.use-case.js';
import { ListProductsAdminUseCase } from './application/use-cases/admin/list-products-admin.use-case.js';
import { CreateProductUseCase } from './application/use-cases/admin/create-product.use-case.js';
import { UpdateProductUseCase } from './application/use-cases/admin/update-product.use-case.js';
import { SetProductActiveUseCase } from './application/use-cases/admin/set-product-active.use-case.js';
import {
  CreateVariantUseCase,
  DeleteVariantUseCase,
  UpdateVariantUseCase,
} from './application/use-cases/admin/manage-variant.use-case.js';
import {
  CreateCategoryUseCase,
  ListCategoriesAdminUseCase,
  SetCategoryActiveUseCase,
  UpdateCategoryUseCase,
} from './application/use-cases/admin/manage-category.use-case.js';
import { ProductsController } from './presentation/products.controller.js';
import { CategoriesController } from './presentation/categories.controller.js';
import { AdminProductsController } from './presentation/admin-products.controller.js';
import { AdminCategoriesController } from './presentation/admin-categories.controller.js';

/**
 * Punto donde se cablea la inversion de dependencias del catalogo.
 *
 * Los casos de uso piden ProductRepository (la abstraccion del dominio) y el
 * contenedor les entrega PrismaProductRepository (la implementacion concreta).
 * Este archivo es el unico lugar del modulo donde ambas se encuentran: cambiar
 * de persistencia se reduce a cambiar estas dos lineas useClass.
 *
 * Los controladores admin viven en el mismo modulo que los publicos porque
 * ambos comparten el mismo agregado (Product, Category) y sus mismos puertos:
 * separar el CRUD en otro modulo obligaria a exportar mas superficie de la
 * necesaria solo para volver a importarla aqui.
 */
@Module({
  controllers: [
    ProductsController,
    CategoriesController,
    AdminProductsController,
    AdminCategoriesController,
  ],
  providers: [
    { provide: ProductRepository, useClass: PrismaProductRepository },
    { provide: CategoryRepository, useClass: PrismaCategoryRepository },
    ListProductsUseCase,
    GetProductBySlugUseCase,
    GetProductFacetsUseCase,
    ListCategoriesUseCase,
    ListProductsAdminUseCase,
    CreateProductUseCase,
    UpdateProductUseCase,
    SetProductActiveUseCase,
    CreateVariantUseCase,
    UpdateVariantUseCase,
    DeleteVariantUseCase,
    ListCategoriesAdminUseCase,
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    SetCategoryActiveUseCase,
  ],
  exports: [ProductRepository, CategoryRepository],
})
export class CatalogModule {}
