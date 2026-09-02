import { Injectable } from '@nestjs/common';
import type { Product } from '../../../domain/entities/product.entity.js';
import { ProductRepository } from '../../../domain/repositories/product.repository.js';

/**
 * Publica o retira una prenda de la tienda.
 *
 * Se retira en lugar de borrarse: las ordenes ya emitidas referencian la
 * prenda por su copia en OrderItem, pero un borrado fisico complicaria el
 * historial y las estadisticas de ventas sin necesidad real.
 */
@Injectable()
export class SetProductActiveUseCase {
  constructor(private readonly products: ProductRepository) {}

  execute(id: string, isActive: boolean): Promise<Product> {
    return this.products.setActive(id, isActive);
  }
}
