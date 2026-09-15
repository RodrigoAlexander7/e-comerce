import { InvalidValueError } from '../../../../shared/domain/domain-error.js';
import { Identification } from './identification.js';

// Deliberadamente permisivo: valida la forma, no la existencia. Rechazar
// direcciones raras pero validas pierde ventas.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Acepta el formato internacional (+51 9XX XXX XXX) y el local de 9 digitos.
const PHONE_PATTERN = /^\+?\d[\d\s-]{7,17}$/;

/**
 * Datos de contacto e identidad de quien compra.
 *
 * Se capturan en el paso 1 del checkout y quedan congelados en la orden: si
 * mas adelante el cliente cambia su perfil, la orden conserva lo que declaro
 * en el momento de comprar, que es lo que exige la factura.
 */
export class CustomerDetails {
  private constructor(
    readonly name: string,
    readonly email: string,
    readonly phone: string,
    readonly identification: Identification,
  ) {}

  static create(input: {
    name: string;
    email: string;
    phone: string;
    identification: Identification;
  }): CustomerDetails {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    const phone = input.phone.trim();

    if (name.length < 2) {
      throw new InvalidValueError('El nombre debe tener al menos 2 caracteres.');
    }
    if (!EMAIL_PATTERN.test(email)) {
      throw new InvalidValueError(`El correo electronico "${input.email}" no es valido.`);
    }
    if (!PHONE_PATTERN.test(phone)) {
      throw new InvalidValueError(`El telefono "${input.phone}" no es valido.`);
    }

    return new CustomerDetails(name, email, phone, input.identification);
  }
}
