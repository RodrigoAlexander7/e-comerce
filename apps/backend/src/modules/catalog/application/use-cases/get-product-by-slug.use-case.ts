import { Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../../shared/domain/domain-error.js';
import type { Product } from '../../domain/entities/product.entity.js';
import { ProductRepository } from '../../domain/repositories/product.repository.js';

/** Recupera la ficha de una prenda por su slug publico. */
@Injectable()
export class GetProductBySlugUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(slug: string): Promise<Product> {
    const product = await this.products.findBySlug(slug);
    if (product === null) {
      throw new NotFoundError('la prenda', slug);
    }
    return product;
  }
}
