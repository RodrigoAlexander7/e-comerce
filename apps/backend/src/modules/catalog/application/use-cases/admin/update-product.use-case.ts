import { Injectable } from '@nestjs/common';
import type { Product } from '../../../domain/entities/product.entity.js';
import { ProductRepository, type UpdateProductInput } from '../../../domain/repositories/product.repository.js';

/** Edita los datos generales de una prenda ya existente. */
@Injectable()
export class UpdateProductUseCase {
  constructor(private readonly products: ProductRepository) {}

  execute(id: string, patch: UpdateProductInput): Promise<Product> {
    return this.products.update(id, patch);
  }
}
