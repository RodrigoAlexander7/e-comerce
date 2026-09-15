import { describe, expect, it } from 'vitest';
import { InvalidValueError } from '../domain-error.js';
import { Money } from '../money.js';

describe('Money', () => {
  it('rechaza importes negativos', () => {
    expect(() => Money.fromCents(-1)).toThrow(InvalidValueError);
  });

  it('rechaza centimos fraccionarios', () => {
    expect(() => Money.fromCents(10.5)).toThrow(InvalidValueError);
  });

  it('convierte unidades a centimos sin error de coma flotante', () => {
    // 19.99 * 100 da 1998.9999... en binario; redondear es obligatorio.
    expect(Money.fromUnits(19.99).cents).toBe(1_999);
    expect(Money.fromUnits(0.1).add(Money.fromUnits(0.2)).cents).toBe(30);
  });

  it('suma y multiplica sin perder precision', () => {
    const unit = Money.fromCents(3_333);
    expect(unit.multiply(3).cents).toBe(9_999);
    expect(unit.add(unit).add(unit).cents).toBe(9_999);
  });

  it('impide que una resta deje un importe negativo', () => {
    expect(() => Money.fromCents(100).subtract(Money.fromCents(101))).toThrow(InvalidValueError);
  });

  it('rechaza multiplicar por una cantidad fraccionaria', () => {
    expect(() => Money.fromCents(100).multiply(1.5)).toThrow(InvalidValueError);
  });
});
