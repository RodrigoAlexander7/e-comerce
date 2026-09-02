import type { User, UserRoleValue } from '../entities/user.entity.js';

/** Perfil que devuelve el proveedor de identidad federada. */
export interface FederatedProfile {
  readonly googleId: string;
  readonly email: string;
  readonly name: string;
  readonly avatarUrl: string | null;
}

/** Puerto de acceso a cuentas de usuario. */
export abstract class UserRepository {
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;

  /**
   * Localiza la cuenta del perfil de Google, creandola si es la primera vez.
   *
   * La busqueda es por correo y no solo por identificador de Google para que
   * una cuenta creada antes por otra via (por ejemplo un administrador
   * sembrado) quede vinculada en lugar de duplicarse.
   */
  abstract findOrCreateFromGoogle(profile: FederatedProfile): Promise<User>;

  abstract updateRole(userId: string, role: UserRoleValue): Promise<User>;
  abstract listAdmins(): Promise<User[]>;
}
