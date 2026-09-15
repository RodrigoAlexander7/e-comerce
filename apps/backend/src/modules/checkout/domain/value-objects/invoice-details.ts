import { InvalidValueError } from '../../../../shared/domain/domain-error.js';
import { assertValidRuc } from './identification.js';

/**
 * Datos de facturacion corporativa.
 *
 * Solo existen si el cliente marco "Necesito una factura". Se modelan como un
 * objeto de valor completo o ausente (null) en lugar de dos campos opcionales
 * sueltos, para que sea imposible guardar una razon social sin su RUC.
 */
export class InvoiceDetails {
  private constructor(
    readonly businessName: string,
    readonly ruc: string,
  ) {}

  static create(businessName: string, ruc: string): InvoiceDetails {
    const name = businessName.trim();
    if (name.length < 3) {
      throw new InvalidValueError('La razon social debe tener al menos 3 caracteres.');
    }
    return new InvoiceDetails(name, assertValidRuc(ruc));
  }
}
