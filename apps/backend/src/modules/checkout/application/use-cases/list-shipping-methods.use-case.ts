import { Injectable } from '@nestjs/common';
import type { ShippingMethod } from '../../domain/entities/shipping-method.entity.js';
import { ShippingMethodRepository } from '../../domain/repositories/shipping-method.repository.js';

/** Opciones de entrega disponibles en el paso 2 del checkout. */
@Injectable()
export class ListShippingMethodsUseCase {
  constructor(private readonly shippingMethods: ShippingMethodRepository) {}

  execute(): Promise<ShippingMethod[]> {
    return this.shippingMethods.findAllActive();
  }
}
