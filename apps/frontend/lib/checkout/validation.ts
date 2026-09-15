import type { AddressForm, CheckoutForm } from "./checkout-context";
import type { IdentificationType } from "@/lib/api/types";

/**
 * Validacion del formulario en el navegador.
 *
 * Es una comodidad para el cliente, no una defensa: las mismas reglas las
 * vuelve a aplicar el dominio del backend, que es quien decide de verdad.
 * Duplicarlas aqui solo evita un viaje al servidor para descubrir un error
 * evidente.
 */

const ID_RULES: Record<IdentificationType, { test: (value: string) => boolean; message: string }> = {
  DNI: { test: (v) => /^\d{8}$/.test(v), message: "El DNI debe tener 8 digitos." },
  CE: { test: (v) => /^\d{9,12}$/.test(v), message: "El carne debe tener entre 9 y 12 digitos." },
  PASSPORT: {
    test: (v) => /^[A-Za-z0-9]{6,12}$/.test(v),
    message: "El pasaporte debe tener entre 6 y 12 caracteres.",
  },
  RUC: {
    test: (v) => /^(10|15|17|20)\d{9}$/.test(v),
    message: "El RUC debe tener 11 digitos y empezar por 10, 15, 17 o 20.",
  },
};

export type DetailsErrors = Partial<
  Record<
    | "customerName"
    | "customerEmail"
    | "customerPhone"
    | "idNumber"
    | "businessName"
    | "ruc",
    string
  >
> & { shippingAddress?: Partial<Record<keyof AddressForm, string>> };

export function validateDetails(form: CheckoutForm): DetailsErrors {
  const errors: DetailsErrors = {};

  if (form.customerName.trim().length < 2) {
    errors.customerName = "Escribe tu nombre completo.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.customerEmail.trim())) {
    errors.customerEmail = "Escribe un correo electronico valido.";
  }
  if (!/^\+?\d[\d\s-]{7,17}$/.test(form.customerPhone.trim())) {
    errors.customerPhone = "Escribe un telefono valido, por ejemplo +51 930 900 259.";
  }

  const idRule = ID_RULES[form.idType];
  if (!idRule.test(form.idNumber.trim())) {
    errors.idNumber = idRule.message;
  }

  if (form.needsInvoice) {
    if (form.businessName.trim().length < 3) {
      errors.businessName = "Escribe la razon social de la empresa.";
    }
    if (!ID_RULES.RUC.test(form.ruc.trim())) {
      errors.ruc = ID_RULES.RUC.message;
    }
  }

  const address = validateAddress(form.shippingAddress);
  if (Object.keys(address).length > 0) {
    errors.shippingAddress = address;
  }

  return errors;
}

export function validateAddress(address: AddressForm): Partial<Record<keyof AddressForm, string>> {
  const errors: Partial<Record<keyof AddressForm, string>> = {};

  if (address.state.trim() === "") errors.state = "Selecciona un departamento.";
  if (address.city.trim() === "") errors.city = "Selecciona una provincia.";
  if (address.district.trim() === "") errors.district = "Indica el distrito.";
  if (address.street.trim() === "") errors.street = "Escribe la calle y el numero.";

  return errors;
}

export function hasErrors(errors: DetailsErrors): boolean {
  return Object.keys(errors).length > 0;
}
