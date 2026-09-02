import { InvalidValueError } from '../../../../shared/domain/domain-error.js';

export interface AddressInput {
  country: string;
  state: string;
  city: string;
  district: string;
  street: string;
  apartment?: string | null;
}

/**
 * Direccion postal, usada tanto para envio como para facturacion.
 *
 * Se guarda copiada dentro de la orden y no como referencia a una direccion
 * del usuario: si el cliente edita luego su libreta de direcciones, el
 * historial de a donde se envio realmente cada pedido no debe cambiar.
 */
export class Address {
  private constructor(
    readonly country: string,
    readonly state: string,
    readonly city: string,
    readonly district: string,
    readonly street: string,
    readonly apartment: string | null,
  ) {}

  static create(input: AddressInput): Address {
    const required = {
      pais: input.country,
      'estado o provincia': input.state,
      ciudad: input.city,
      distrito: input.district,
      'calle y numero': input.street,
    };

    for (const [label, value] of Object.entries(required)) {
      if (value.trim().length === 0) {
        throw new InvalidValueError(`El campo "${label}" de la direccion es obligatorio.`);
      }
    }

    const apartment = input.apartment?.trim() ?? '';

    return new Address(
      input.country.trim(),
      input.state.trim(),
      input.city.trim(),
      input.district.trim(),
      input.street.trim(),
      apartment.length > 0 ? apartment : null,
    );
  }

  /** Direccion en una linea, para resumenes y correos. */
  toSingleLine(): string {
    return [this.street, this.apartment, this.district, this.city, this.state, this.country]
      .filter((part): part is string => part !== null && part.length > 0)
      .join(', ');
  }
}
