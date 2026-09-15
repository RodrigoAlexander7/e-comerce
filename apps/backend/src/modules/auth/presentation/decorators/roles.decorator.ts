import { SetMetadata } from '@nestjs/common';
import type { UserRoleValue } from '../../domain/entities/user.entity.js';

export const ROLES_KEY = 'atlas:required-role';

/**
 * Rol minimo exigido por una ruta o un controlador entero.
 *
 * Se declara el minimo y no una lista porque los roles son jerarquicos: pedir
 * ADMIN admite tambien a un SUPERADMIN sin tener que enumerarlo.
 */
export const Roles = (required: UserRoleValue) => SetMetadata(ROLES_KEY, required);

export const PUBLIC_KEY = 'atlas:public';

/** Marca una ruta como accesible sin sesion dentro de un area protegida. */
export const Public = () => SetMetadata(PUBLIC_KEY, true);
