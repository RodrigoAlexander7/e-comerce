import { Money } from '../../../../shared/domain/money.js';
import { breakdownFromGross } from '../../../../shared/domain/tax.js';
import type { OrderItem } from '../entities/order-item.entity.js';

/** Cifras que ve el cliente en el resumen del checkout y en la factura. */
export interface OrderTotals {
  /** Base imponible de prendas mas envio, sin IGV. */
  readonly subtotal: Money;
  /** Coste de entrega con IGV incluido, tal como se anuncia. */
  readonly shipping: Money;
  /** IGV total de la operacion. */
  readonly tax: Money;
  /** Importe final a pagar. */
  readonly total: Money;
  readonly taxRateBps: number;
}

/**
 * Calcula los totales de una orden.
 *
 * Los precios del catalogo y del envio se anuncian CON IGV incluido, que es lo
 * que exige la normativa peruana de cara al consumidor. La factura, en cambio,
 * necesita la base imponible separada, asi que el desglose se obtiene hacia
 * atras a partir del total bruto.
 *
 * El impuesto se calcula por diferencia (total - base) y nunca multiplicando
 * la base por la tasa: al redondear, la multiplicacion puede dejar un centimo
 * descuadrado entre las tres cifras impresas en la factura.
 */
export function calculateOrderTotals(
  items: readonly OrderItem[],
  shipping: Money,
  taxRateBps: number,
): OrderTotals {
  const itemsGross = items.reduce<Money>((sum, item) => sum.add(item.lineTotal), Money.zero());
  const gross = itemsGross.add(shipping);
  const { net, tax } = breakdownFromGross(gross, taxRateBps);

  return { subtotal: net, shipping, tax, total: gross, taxRateBps };
}
