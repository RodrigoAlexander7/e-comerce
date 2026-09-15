import { Money } from './money.js';

/**
 * Desglose fiscal de una venta.
 *
 * En Peru los precios se exhiben al publico CON IGV incluido. La factura, en
 * cambio, exige mostrar la base imponible y el impuesto por separado, asi que
 * el desglose se calcula hacia atras a partir del total bruto.
 */
export interface TaxBreakdown {
  /** Base imponible: el total sin impuesto. */
  readonly net: Money;
  /** IGV correspondiente. */
  readonly tax: Money;
  /** Lo que el cliente paga realmente. */
  readonly gross: Money;
}

/**
 * Extrae la base imponible de un importe que ya incluye impuesto.
 *
 * El impuesto se obtiene por diferencia (gross - net) y no por multiplicacion,
 * para que la suma de las tres cifras cuadre exactamente al centimo y no
 * aparezca un descuadre de redondeo en la factura.
 *
 * @param gross      Importe con impuesto incluido.
 * @param taxRateBps Tasa en puntos basicos: 1800 equivale al 18 % del IGV.
 */
export function breakdownFromGross(gross: Money, taxRateBps: number): TaxBreakdown {
  const netCents = Math.round((gross.cents * 10_000) / (10_000 + taxRateBps));
  const net = Money.fromCents(netCents);
  return { net, tax: gross.subtract(net), gross };
}
