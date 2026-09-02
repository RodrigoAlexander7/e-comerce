import { Injectable } from '@nestjs/common';
import type { Product } from '../../../domain/entities/product.entity.js';
import { isClothingSize } from '../../../domain/entities/product-variant.entity.js';
import { BusinessRuleError } from '../../../../../shared/domain/domain-error.js';
import { ProductRepository, type VariantInput } from '../../../domain/repositories/product.repository.js';

function assertValidSize(size: string | undefined): void {
  if (size !== undefined && !isClothingSize(size)) {
    throw new BusinessRuleError(`"${size}" no es una talla admitida.`);
  }
}

/** Anade una talla/color nuevo al inventario de una prenda existente. */
@Injectable()
export class CreateVariantUseCase {
  constructor(private readonly products: ProductRepository) {}

  execute(productId: string, input: VariantInput): Promise<Product> {
    assertValidSize(input.size);
    return this.products.createVariant(productId, input);
  }
}

/** Edita el stock, precio o estado de una variante existente. */
@Injectable()
export class UpdateVariantUseCase {
  constructor(private readonly products: ProductRepository) {}

  execute(variantId: string, patch: Partial<VariantInput>): Promise<Product> {
    assertValidSize(patch.size);
    return this.products.updateVariant(variantId, patch);
  }
}

/** Retira una talla/color del inventario de una prenda. */
@Injectable()
export class DeleteVariantUseCase {
  constructor(private readonly products: ProductRepository) {}

  execute(variantId: string): Promise<Product> {
    return this.products.deleteVariant(variantId);
  }
}
