import { describe, expect, it } from 'vitest';
import { InvalidValueError } from '../../../../../shared/domain/domain-error.js';
import { User } from '../user.entity.js';

function user(role: 'CUSTOMER' | 'ADMIN' | 'SUPERADMIN', isActive = true) {
  return new User({
    id: 'u1',
    email: 'ana@ejemplo.com',
    name: 'Ana',
    phone: null,
    role,
    avatarUrl: null,
    googleId: 'g1',
    isActive,
    createdAt: new Date('2026-01-01'),
  });
}

describe('User', () => {
  it('normaliza el correo a minusculas', () => {
    expect(
      new User({
        id: 'u1',
        email: 'Ana@Ejemplo.COM',
        name: 'Ana',
        phone: null,
        role: 'CUSTOMER',
        avatarUrl: null,
        googleId: null,
        isActive: true,
        createdAt: new Date(),
      }).email,
    ).toBe('ana@ejemplo.com');
  });

  it('rechaza un correo sin arroba', () => {
    expect(
      () =>
        new User({
          id: 'u1',
          email: 'no-es-un-correo',
          name: 'Ana',
          phone: null,
          role: 'CUSTOMER',
          avatarUrl: null,
          googleId: null,
          isActive: true,
          createdAt: new Date(),
        }),
    ).toThrow(InvalidValueError);
  });

  it('un rol superior cumple tambien los requisitos de uno inferior', () => {
    expect(user('SUPERADMIN').hasAtLeast('CUSTOMER')).toBe(true);
    expect(user('SUPERADMIN').hasAtLeast('ADMIN')).toBe(true);
    expect(user('ADMIN').hasAtLeast('SUPERADMIN')).toBe(false);
  });

  it('CUSTOMER no puede acceder al panel', () => {
    expect(user('CUSTOMER').canAccessAdmin).toBe(false);
    expect(user('ADMIN').canAccessAdmin).toBe(true);
  });

  it('solo SUPERADMIN puede gestionar otras cuentas', () => {
    expect(user('ADMIN').canManageUsers).toBe(false);
    expect(user('SUPERADMIN').canManageUsers).toBe(true);
  });

  it('una cuenta desactivada no cumple ningun rol, ni siquiera el suyo', () => {
    // Retirar el acceso debe surtir efecto de inmediato, sin depender de que
    // ademas alguien recuerde bajarle el rol.
    expect(user('SUPERADMIN', false).hasAtLeast('CUSTOMER')).toBe(false);
    expect(user('ADMIN', false).canAccessAdmin).toBe(false);
  });
});
