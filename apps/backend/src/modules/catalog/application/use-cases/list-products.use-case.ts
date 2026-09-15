import { Injectable } from '@nestjs/common';
import type { Page, PageRequest } from '../../../../shared/domain/pagination.js';
import type { Product } from '../../domain/entities/product.entity.js';
import {
  ProductRepository,
  type ProductFilter,
  type ProductSort,
} from '../../domain/repositories/product.repository.js';

export interface ListProductsInput {
  readonly filter: ProductFilter;
  readonly page: PageRequest;
  readonly sort: ProductSort;
}

/**
 * Lista el catalogo publico con filtros, orden y paginacion.
 *
 * Depende de la abstraccion ProductRepository, nunca de Prisma. Sustituir
 * PostgreSQL por otro almacen no obligaria a tocar este archivo.
 */
@Injectable()
export class ListProductsUseCase {
  constructor(private readonly products: ProductRepository) {}

  execute(input: ListProductsInput): Promise<Page<Product>> {
    // El catalogo publico jamas expone prendas deshabilitadas, sin importar lo
    // que llegue por la peticion.
    const filter: ProductFilter = { ...input.filter, includeInactive: false };
    return this.products.findMany(filter, input.page, input.sort);
  }
}
