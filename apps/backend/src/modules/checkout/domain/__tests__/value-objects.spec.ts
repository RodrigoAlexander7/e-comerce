import { describe, expect, it } from 'vitest';
import { InvalidValueError } from '../../../../shared/domain/domain-error.js';
import { OrderNumber } from '../value-objects/order-number.js';
import { Identification } from '../value-objects/identification.js';
import { CustomerDetails } from '../value-objects/customer-details.js';
import { InvoiceDetails } from '../value-objects/invoice-details.js';
import { Address } from '../value-objects/address.js';

describe('OrderNumber', () => {
  it('formatea la secuencia con el prefijo y cinco digitos', () => {
    expect(OrderNumber.fromSequence(2415).value).toBe('S02415');
    expect(OrderNumber.fromSequence(7).value).toBe('S00007');
  });

  it('no trunca secuencias que superan los cinco digitos', () => {
    // Al llegar a la orden 100000 el codigo debe crecer, no reiniciarse.
    expect(OrderNumber.fromSequence(123456).value).toBe('S123456');
  });

  it('normaliza y rechaza cadenas mal formadas', () => {
    expect(OrderNumber.fromString(' s02415 ').value).toBe('S02415');
    expect(() => OrderNumber.fromString('02415')).toThrow(InvalidValueError);
    expect(() => OrderNumber.fromString('SABCDE')).toThrow(InvalidValueError);
  });
});

describe('Identification', () => {
  it('acepta un DNI de ocho digitos', () => {
    expect(Identification.create('DNI', '76435222').number).toBe('76435222');
  });

  it('rechaza un DNI que no tenga exactamente ocho digitos', () => {
    expect(() => Identification.create('DNI', '7643522')).toThrow(InvalidValueError);
    expect(() => Identification.create('DNI', '764352229')).toThrow(InvalidValueError);
  });

  it('exige que el RUC empiece por un prefijo valido', () => {
    expect(Identification.create('RUC', '20601758815').number).toBe('20601758815');
    expect(() => Identification.create('RUC', '30601758815')).toThrow(InvalidValueError);
  });

  it('normaliza el pasaporte a mayusculas', () => {
    expect(Identification.create('PASSPORT', 'ab12cd34').number).toBe('AB12CD34');
  });
});

describe('CustomerDetails', () => {
  const id = Identification.create('DNI', '76435222');

  it('normaliza el correo a minusculas y recorta espacios', () => {
    const customer = CustomerDetails.create({
      name: '  Juan Perez ',
      email: '  Juan@Ejemplo.COM ',
      phone: '+51 930 900 259',
      identification: id,
    });
    expect(customer.email).toBe('juan@ejemplo.com');
    expect(customer.name).toBe('Juan Perez');
  });

  it('rechaza correos y telefonos mal formados', () => {
    const base = { name: 'Juan', phone: '+51930900259', identification: id };
    expect(() => CustomerDetails.create({ ...base, email: 'sin-arroba' })).toThrow(InvalidValueError);
    expect(() =>
      CustomerDetails.create({ ...base, email: 'a@b.pe', phone: '123' }),
    ).toThrow(InvalidValueError);
  });
});

describe('InvoiceDetails', () => {
  it('exige razon social y RUC validos a la vez', () => {
    const invoice = InvoiceDetails.create(' Ingenieria ', '10524346251');
    expect(invoice.businessName).toBe('Ingenieria');
    expect(invoice.ruc).toBe('10524346251');

    // Una factura con razon social pero sin RUC valido no puede existir.
    expect(() => InvoiceDetails.create('Ingenieria', '123')).toThrow(InvalidValueError);
    expect(() => InvoiceDetails.create('X', '10524346251')).toThrow(InvalidValueError);
  });
});

describe('Address', () => {
  const base = {
    country: 'Peru',
    state: 'Arequipa',
    city: 'Arequipa',
    district: 'Miraflores',
    street: 'Calle San Antonio 223',
  };

  it('rechaza cualquier campo obligatorio en blanco', () => {
    expect(() => Address.create({ ...base, district: '   ' })).toThrow(InvalidValueError);
  });

  it('trata un departamento vacio como ausente', () => {
    expect(Address.create({ ...base, apartment: '  ' }).apartment).toBeNull();
    expect(Address.create({ ...base, apartment: 'Dpto 402' }).apartment).toBe('Dpto 402');
  });

  it('compone una linea legible omitiendo lo que falta', () => {
    expect(Address.create(base).toSingleLine()).toBe(
      'Calle San Antonio 223, Miraflores, Arequipa, Arequipa, Peru',
    );
  });
});
