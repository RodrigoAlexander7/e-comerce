import { InvalidValueError } from '../../../../shared/domain/domain-error.js';

export interface BankAccountValue {
  readonly id: string;
  readonly bank: string;
  readonly accountNumber: string;
  readonly cci: string;
}

export interface StoreSettingsProps {
  readonly companyName: string;
  readonly companyRuc: string;
  readonly companyEmail: string;
  readonly whatsapp: string;
  readonly yapePhone: string;
  /** Nula mientras no se haya subido ningun QR desde el panel. */
  readonly yapeQrUrl: string | null;
  readonly paymentWindowHours: number;
  readonly bankAccounts: readonly BankAccountValue[];
  readonly updatedAt: Date;
}

/**
 * Datos de pago y de la empresa que ve el cliente en el checkout y el correo.
 *
 * Es configuracion editable, no un objeto de dominio transaccional: no hay
 * reglas de negocio complejas, solo validacion de forma para que el panel no
 * pueda guardar un RUC o un telefono claramente invalidos.
 */
export class StoreSettings {
  readonly companyName: string;
  readonly companyRuc: string;
  readonly companyEmail: string;
  readonly whatsapp: string;
  readonly yapePhone: string;
  readonly yapeQrUrl: string | null;
  readonly paymentWindowHours: number;
  readonly bankAccounts: readonly BankAccountValue[];
  readonly updatedAt: Date;

  constructor(props: StoreSettingsProps) {
    if (props.paymentWindowHours < 1 || props.paymentWindowHours > 168) {
      throw new InvalidValueError('El plazo de pago debe estar entre 1 y 168 horas (una semana).');
    }
    this.companyName = props.companyName;
    this.companyRuc = props.companyRuc;
    this.companyEmail = props.companyEmail;
    this.whatsapp = props.whatsapp;
    this.yapePhone = props.yapePhone;
    this.yapeQrUrl = props.yapeQrUrl;
    this.paymentWindowHours = props.paymentWindowHours;
    this.bankAccounts = props.bankAccounts;
    this.updatedAt = props.updatedAt;
  }
}
