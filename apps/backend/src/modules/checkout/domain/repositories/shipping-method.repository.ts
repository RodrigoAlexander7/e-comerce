import type { ShippingMethod } from '../entities/shipping-method.entity.js';

/** Puerto de acceso a las opciones de entrega ofrecidas en el paso 2. */
export abstract class ShippingMethodRepository {
  abstract findAllActive(): Promise<ShippingMethod[]>;
  abstract findActiveById(id: string): Promise<ShippingMethod | null>;
}
