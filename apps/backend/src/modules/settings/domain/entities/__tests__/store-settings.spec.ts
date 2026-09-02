import { describe, expect, it } from 'vitest';
import { InvalidValueError } from '../../../../../shared/domain/domain-error.js';
import { StoreSettings } from '../store-settings.entity.js';

function settings(paymentWindowHours: number) {
  return new StoreSettings({
    companyName: 'Atlas Sport SAC',
    companyRuc: '20601758815',
    companyEmail: 'ventas@atlassport.pe',
    whatsapp: '51946146622',
    yapePhone: '946 146 622',
    yapeQrUrl: null,
    paymentWindowHours,
    bankAccounts: [],
    updatedAt: new Date(),
  });
}

describe('StoreSettings', () => {
  it('acepta plazos entre 1 hora y una semana', () => {
    expect(settings(1).paymentWindowHours).toBe(1);
    expect(settings(168).paymentWindowHours).toBe(168);
  });

  it('rechaza un plazo de cero o negativo', () => {
    expect(() => settings(0)).toThrow(InvalidValueError);
    expect(() => settings(-1)).toThrow(InvalidValueError);
  });

  it('rechaza un plazo mayor a una semana', () => {
    expect(() => settings(169)).toThrow(InvalidValueError);
  });

  it('el QR es nulo mientras nadie lo haya subido', () => {
    expect(settings(2).yapeQrUrl).toBeNull();
  });
});
