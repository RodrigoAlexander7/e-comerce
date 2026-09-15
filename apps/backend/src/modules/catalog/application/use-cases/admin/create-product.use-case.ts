import { Injectable } from '@nestjs/common';
import type { Product } from '../../../domain/entities/product.entity.js';
import { isClothingSize } from '../../../domain/entities/product-variant.entity.js';
import { BusinessRuleError } from '../../../../../shared/domain/domain-error.js';
import { ProductRepository, type CreateProductInput } from '../../../domain/repositories/product.repository.js';

/** Crea una prenda nueva con sus variantes iniciales. */
@Injectable()
export class CreateProductUseCase {
  constructor(private readonly products: ProductRepository) {}

  execute(input: CreateProductInput): Promise<Product> {
    if (input.variants.length === 0) {
      throw new BusinessRuleError('Una prenda necesita al menos una variante (talla y color) para poder venderse.');
    }
    for (const variant of input.variants) {
      if (!isClothingSize(variant.size)) {
        throw new BusinessRuleError(`"${variant.size}" no es una talla admitida.`);
      }
    }
    return this.products.create(input);
  }
}
