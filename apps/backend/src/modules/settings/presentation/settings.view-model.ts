import type { StoreSettings } from '../domain/entities/store-settings.entity.js';

export interface StoreSettingsView {
  companyName: string;
  companyRuc: string;
  companyEmail: string;
  whatsapp: string;
  yapePhone: string;
  yapeQrUrl: string | null;
  paymentWindowHours: number;
  bankAccounts: { id: string; bank: string; accountNumber: string; cci: string }[];
  updatedAt: string;
}

export function toStoreSettingsView(settings: StoreSettings): StoreSettingsView {
  return {
    companyName: settings.companyName,
    companyRuc: settings.companyRuc,
    companyEmail: settings.companyEmail,
    whatsapp: settings.whatsapp,
    yapePhone: settings.yapePhone,
    yapeQrUrl: settings.yapeQrUrl,
    paymentWindowHours: settings.paymentWindowHours,
    bankAccounts: settings.bankAccounts.map((account) => ({ ...account })),
    updatedAt: settings.updatedAt.toISOString(),
  };
}
