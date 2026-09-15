import { describe, expect, it } from 'vitest';
import { Money } from '../money.js';
import { breakdownFromGross } from '../tax.js';

/**
 * Las cifras esperadas provienen del checkout de referencia que debe
 * replicarse. Si alguien cambia la formula del IGV, estas pruebas lo detectan
 * antes de que el cliente reciba una factura descuadrada.
 */
describe('breakdownFromGross', () => {
  const IGV = 1800;

  it('desglosa una prenda sin envio igual que el checkout de referencia', () => {
    const { net, tax, gross } = breakdownFromGross(Money.fromCents(72_500), IGV);

    expect(net.cents).toBe(61_441); // S/ 614.41
    expect(tax.cents).toBe(11_059); // S/ 110.59
    expect(gross.cents).toBe(72_500); // S/ 725.00
  });

  it('desglosa prenda mas envio igual que el checkout de referencia', () => {
    const { net, tax, gross } = breakdownFromGross(Money.fromCents(72_500 + 2_135), IGV);

    expect(net.cents).toBe(63_250); // S/ 632.50
    expect(tax.cents).toBe(11_385); // S/ 113.85
    expect(gross.cents).toBe(74_635); // S/ 746.35
  });

  it('mantiene la identidad base + impuesto = total en cualquier importe', () => {
    // El impuesto se calcula por diferencia justamente para que nunca aparezca
    // un centimo perdido por redondeo, ni siquiera en importes adversos.
    for (let cents = 1; cents <= 5_000; cents += 7) {
      const { net, tax, gross } = breakdownFromGross(Money.fromCents(cents), IGV);
      expect(net.cents + tax.cents).toBe(gross.cents);
    }
  });

  it('no cobra impuesto sobre un importe nulo', () => {
    const { net, tax } = breakdownFromGross(Money.zero(), IGV);
    expect(net.cents).toBe(0);
    expect(tax.cents).toBe(0);
  });
});
