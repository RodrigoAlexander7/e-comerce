import { Injectable } from '@nestjs/common';
import type { Page, PageRequest } from '../../../../../shared/domain/pagination.js';
import type { Product } from '../../../domain/entities/product.entity.js';
import { ProductRepository, type ProductFilter, type ProductSort } from '../../../domain/repositories/product.repository.js';

export interface ListProductsAdminInput {
  readonly filter: Omit<ProductFilter, 'includeInactive'>;
  readonly page: PageRequest;
  readonly sort: ProductSort;
}

/**
 * Lista el catalogo para el panel, incluyendo prendas deshabilitadas.
 *
 * Es identico a ListProductsUseCase salvo por esa unica diferencia: aqui
 * `includeInactive` siempre es true, porque un administrador necesita ver lo
 * que retiro de la tienda para poder reactivarlo.
 */
@Injectable()
export class ListProductsAdminUseCase {
  constructor(private readonly products: ProductRepository) {}

  execute(input: ListProductsAdminInput): Promise<Page<Product>> {
    return this.products.findMany({ ...input.filter, includeInactive: true }, input.page, input.sort);
  }
}
