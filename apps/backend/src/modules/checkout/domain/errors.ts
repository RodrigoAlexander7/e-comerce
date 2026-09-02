import { BusinessRuleError, NotFoundError } from '../../../shared/domain/domain-error.js';

/** No queda mercancia suficiente para atender una linea del carrito. */
export class InsufficientStockError extends BusinessRuleError {
  constructor(
    readonly sku: string,
    readonly requested: number,
    readonly available: number,
  ) {
    super(
      available === 0
        ? `La talla seleccionada de ${sku} se agoto mientras completabas la compra.`
        : `Solo quedan ${available} unidades de ${sku} y pediste ${requested}.`,
    );
  }
}

/** Una variante del carrito ya no existe o dejo de venderse. */
export class VariantUnavailableError extends BusinessRuleError {
  constructor(variantId: string) {
    super(`Una de las prendas de tu carrito ya no esta disponible (${variantId}).`);
  }
}

/** El carrito llego vacio al momento de confirmar. */
export class EmptyCartError extends BusinessRuleError {
  constructor() {
    super('No se puede confirmar una compra con el carrito vacio.');
  }
}

export class ShippingMethodNotFoundError extends NotFoundError {
  constructor(id: string) {
    super('el metodo de entrega', id);
  }
}
