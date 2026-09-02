import { InvalidValueError } from '../../../../shared/domain/domain-error.js';

export const USER_ROLES = ['CUSTOMER', 'ADMIN', 'SUPERADMIN'] as const;
export type UserRoleValue = (typeof USER_ROLES)[number];

/**
 * Jerarquia de permisos.
 *
 * Un rol superior cubre todo lo que puede hacer uno inferior, de modo que
 * proteger una ruta con ADMIN no obliga a enumerar tambien SUPERADMIN. Se
 * declara aqui, en el dominio, y no en el guardian: es una regla de negocio
 * sobre quien puede que, y no un detalle de como se aplica en HTTP.
 */
const RANK: Record<UserRoleValue, number> = {
  CUSTOMER: 0,
  ADMIN: 1,
  SUPERADMIN: 2,
};

export interface UserProps {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly phone: string | null;
  readonly role: UserRoleValue;
  readonly avatarUrl: string | null;
  readonly googleId: string | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
}

export class User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly phone: string | null;
  readonly role: UserRoleValue;
  readonly avatarUrl: string | null;
  readonly googleId: string | null;
  readonly isActive: boolean;
  readonly createdAt: Date;

  constructor(props: UserProps) {
    if (!props.email.includes('@')) {
      throw new InvalidValueError(`Correo de usuario invalido: "${props.email}".`);
    }
    this.id = props.id;
    this.email = props.email.toLowerCase();
    this.name = props.name;
    this.phone = props.phone;
    this.role = props.role;
    this.avatarUrl = props.avatarUrl;
    this.googleId = props.googleId;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
  }

  /** Cumple el rol exigido, o uno superior. */
  hasAtLeast(required: UserRoleValue): boolean {
    return this.isActive && RANK[this.role] >= RANK[required];
  }

  get canAccessAdmin(): boolean {
    return this.hasAtLeast('ADMIN');
  }

  /** Solo un SUPERADMIN puede tocar cuentas y permisos de otros. */
  get canManageUsers(): boolean {
    return this.hasAtLeast('SUPERADMIN');
  }
}

export function isUserRole(value: string): value is UserRoleValue {
  return (USER_ROLES as readonly string[]).includes(value);
}

export function roleRank(role: UserRoleValue): number {
  return RANK[role];
}
