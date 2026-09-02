import { Injectable } from '@nestjs/common';
import {
  ProductRepository,
  type ProductFacets,
} from '../../domain/repositories/product.repository.js';

/**
 * Devuelve las facetas con las que el listado arma sus filtros: que tallas y
 * colores existen realmente y en que rango de precios se mueve la seleccion.
 */
@Injectable()
export class GetProductFacetsUseCase {
  constructor(private readonly products: ProductRepository) {}

  execute(categorySlug?: string): Promise<ProductFacets> {
    return this.products.findFacets(categorySlug);
  }
}
