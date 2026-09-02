import type { StoreSettings } from '../entities/store-settings.entity.js';

export interface BankAccountInput {
  readonly bank: string;
  readonly accountNumber: string;
  readonly cci: string;
}

export interface UpdateStoreSettingsInput {
  readonly companyName?: string;
  readonly companyRuc?: string;
  readonly companyEmail?: string;
  readonly whatsapp?: string;
  readonly yapePhone?: string;
  /** Undefined deja el QR como esta; null lo retira; una url lo reemplaza. */
  readonly yapeQrUrl?: string | null;
  readonly paymentWindowHours?: number;
  /** Si se incluye, reemplaza la lista completa de cuentas bancarias. */
  readonly bankAccounts?: readonly BankAccountInput[];
}

/**
 * Puerto de la configuracion de la tienda.
 *
 * `get` nunca devuelve null: la fila existe siempre porque se siembra en la
 * primera lectura si todavia no existe, a partir de las variables de entorno.
 * Asi el resto del sistema no tiene que manejar "sin configuracion" como un
 * caso especial.
 */
export abstract class StoreSettingsRepository {
  abstract get(): Promise<StoreSettings>;
  abstract update(patch: UpdateStoreSettingsInput, updatedById: string): Promise<StoreSettings>;
}
