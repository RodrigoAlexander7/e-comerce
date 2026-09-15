import { InvalidValueError } from '../../../../shared/domain/domain-error.js';

/**
 * Codigo publico de una orden: la letra S seguida de cinco digitos (S02415).
 *
 * Es lo unico que el cliente escribe al enviar su comprobante por WhatsApp,
 * asi que debe ser corto, sin caracteres ambiguos y facil de dictar.
 */
export class OrderNumber {
  private constructor(readonly value: string) {}

  static fromSequence(sequence: number): OrderNumber {
    if (!Number.isInteger(sequence) || sequence < 0) {
      throw new InvalidValueError(`Secuencia de orden invalida: ${sequence}.`);
    }
    return new OrderNumber(`S${String(sequence).padStart(5, '0')}`);
  }

  static fromString(value: string): OrderNumber {
    const normalized = value.trim().toUpperCase();
    if (!/^S\d{5,}$/.test(normalized)) {
      throw new InvalidValueError(`Numero de orden invalido: "${value}".`);
    }
    return new OrderNumber(normalized);
  }

  toString(): string {
    return this.value;
  }
}
