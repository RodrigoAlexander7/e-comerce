import {
  CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { TokenIssuer } from '../../application/ports/token-issuer.port.js';
import { GetCurrentUserUseCase } from '../../application/use-cases/get-current-user.use-case.js';
import type { User, UserRoleValue } from '../../domain/entities/user.entity.js';
import { PUBLIC_KEY, ROLES_KEY } from '../decorators/roles.decorator.js';

export const SESSION_COOKIE = 'atlas_session';

/**
 * Guardian unico de sesion y permisos.
 *
 * Resuelve el token, relee la cuenta y comprueba el rol en un solo paso. Se
 * unifica a proposito: con dos guardianes encadenados es facil proteger una
 * ruta con el de roles y olvidar el de sesion, dejandola accesible sin token.
 *
 * La cuenta se relee de la base de datos en cada peticion en lugar de confiar
 * en el rol que viaja en el token, para que retirar permisos a alguien surta
 * efecto de inmediato y no cuando caduque su sesion.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenIssuer,
    private readonly getCurrentUser: GetCurrentUserUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request & { user?: User }>();
    const token = extractToken(request);

    if (token === null) {
      if (isPublic) return true;
      throw new UnauthorizedException('Necesitas iniciar sesion para continuar.');
    }

    // Se intenta resolver el usuario aunque la ruta sea publica: por ejemplo
    // /auth/me necesita saber quien esta detras del token, sin exigir que
    // exista uno. Un token invalido en una ruta publica simplemente se ignora
    // en vez de bloquear la peticion.
    const claims = await this.tokens.verify(token);
    if (claims === null) {
      if (isPublic) return true;
      throw new UnauthorizedException('Tu sesion caduco. Vuelve a iniciar sesion.');
    }

    const user = await this.getCurrentUser.execute(claims.sub);
    if (user === null) {
      if (isPublic) return true;
      throw new UnauthorizedException('Esta cuenta ya no esta disponible.');
    }

    request.user = user;
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<UserRoleValue | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (required !== undefined && !user.hasAtLeast(required)) {
      throw new ForbiddenException('No tienes permisos para realizar esta accion.');
    }

    return true;
  }
}

/**
 * Lee la credencial de la cookie y, si no hay, de la cabecera Authorization.
 *
 * La cookie httpOnly es el mecanismo del navegador y no es accesible desde
 * JavaScript, lo que la protege del robo por XSS. La cabecera existe para
 * clientes que no son navegadores, como scripts de mantenimiento.
 */
function extractToken(request: Request): string | null {
  const cookies = (request as Request & { cookies?: Record<string, string> }).cookies;
  const fromCookie = cookies?.[SESSION_COOKIE];
  if (typeof fromCookie === 'string' && fromCookie.length > 0) return fromCookie;

  const header = request.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice('Bearer '.length).trim() || null;
  }

  return null;
}
