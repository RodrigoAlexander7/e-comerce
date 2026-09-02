import { InvalidValueError } from '../../../../shared/domain/domain-error.js';

/** Documentos de identidad aceptados en el checkout peruano. */
export const IDENTIFICATION_TYPES = ['DNI', 'CE', 'PASSPORT', 'RUC'] as const;
export type IdentificationTypeValue = (typeof IDENTIFICATION_TYPES)[number];

/**
 * Reglas de formato por tipo de documento.
 *
 * Se validan en el dominio y no solo en el formulario: un pedido puede entrar
 * por la API sin pasar por el navegador, y una factura con un RUC mal formado
 * es rechazada despues por SUNAT, cuando ya es tarde.
 */
const RULES: Record<IdentificationTypeValue, { pattern: RegExp; hint: string }> = {
  DNI: { pattern: /^\d{8}$/, hint: 'El DNI debe tener exactamente 8 digitos.' },
  CE: { pattern: /^\d{9,12}$/, hint: 'El carne de extranjeria debe tener entre 9 y 12 digitos.' },
  PASSPORT: {
    pattern: /^[A-Z0-9]{6,12}$/,
    hint: 'El pasaporte debe tener entre 6 y 12 caracteres alfanumericos.',
  },
  RUC: { pattern: /^(10|15|17|20)\d{9}$/, hint: 'El RUC debe tener 11 digitos y empezar por 10, 15, 17 o 20.' },
};

export class Identification {
  private constructor(
    readonly type: IdentificationTypeValue,
    readonly number: string,
  ) {}

  static create(type: IdentificationTypeValue, rawNumber: string): Identification {
    const number = rawNumber.trim().toUpperCase();
    const rule = RULES[type];

    if (!rule) {
      throw new InvalidValueError(`Tipo de identificacion no soportado: "${type}".`);
    }
    if (!rule.pattern.test(number)) {
      throw new InvalidValueError(rule.hint);
    }
    return new Identification(type, number);
  }
}

/** Valida un RUC de forma independiente, para los datos de facturacion. */
export function assertValidRuc(ruc: string): string {
  const normalized = ruc.trim();
  if (!RULES.RUC.pattern.test(normalized)) {
    throw new InvalidValueError(RULES.RUC.hint);
  }
  return normalized;
}
