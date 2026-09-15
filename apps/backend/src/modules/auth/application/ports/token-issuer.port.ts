import type { UserRoleValue } from '../../domain/entities/user.entity.js';

/** Contenido del token de sesion. */
export interface SessionClaims {
  readonly sub: string;
  readonly email: string;
  readonly role: UserRoleValue;
}

/**
 * Puerto de emision y verificacion de credenciales de sesion.
 *
 * El caso de uso no sabe que detras hay un JWT firmado: podria ser una sesion
 * opaca en Redis sin que cambie una linea de la capa de aplicacion.
 */
export abstract class TokenIssuer {
  abstract issue(claims: SessionClaims): Promise<string>;
  abstract verify(token: string): Promise<SessionClaims | null>;
  /** Vida del token en segundos, para fijar la caducidad de la cookie. */
  abstract get lifetimeSeconds(): number;
}
