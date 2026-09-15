import { InvalidValueError } from './domain-error.js';

/**
 * Importe monetario en centimos enteros.
 *
 * Nunca se usan numeros de coma flotante para dinero: un 0.1 + 0.2 en binario
 * arrastra error, y en un carrito con decenas de lineas ese error se acumula
 * hasta desajustar el total contra la pasarela de pago.
 */
export class Money {
  private constructor(readonly cents: number) {}

  static fromCents(cents: number): Money {
    if (!Number.isInteger(cents)) {
      throw new InvalidValueError(`Un importe debe ser entero en centimos, se recibio ${cents}.`);
    }
    if (cents < 0) {
      throw new InvalidValueError(`Un importe no puede ser negativo, se recibio ${cents}.`);
    }
    return new Money(cents);
  }

  /** Convierte un valor en unidades ("725.00") a centimos. Solo para entrada externa. */
  static fromUnits(units: number): Money {
    return Money.fromCents(Math.round(units * 100));
  }

  static zero(): Money {
    return new Money(0);
  }

  add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  subtract(other: Money): Money {
    return Money.fromCents(this.cents - other.cents);
  }

  multiply(factor: number): Money {
    if (!Number.isInteger(factor) || factor < 0) {
      throw new InvalidValueError(`El multiplicador debe ser un entero no negativo, se recibio ${factor}.`);
    }
    return new Money(this.cents * factor);
  }

  isZero(): boolean {
    return this.cents === 0;
  }

  greaterThan(other: Money): boolean {
    return this.cents > other.cents;
  }

  /** Valor en unidades. Solo para serializar hacia el cliente. */
  toUnits(): number {
    return this.cents / 100;
  }
}
