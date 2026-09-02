import { Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { APP_CONFIG, type AppConfig } from '../../../config/app-config.js';
import { TokenIssuer, type SessionClaims } from '../application/ports/token-issuer.port.js';
import { isUserRole } from '../domain/entities/user.entity.js';

/** Adaptador del puerto TokenIssuer sobre JSON Web Tokens firmados. */
@Injectable()
export class JwtTokenIssuer extends TokenIssuer {
  private readonly logger = new Logger(JwtTokenIssuer.name);

  constructor(
    private readonly jwt: JwtService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {
    super();
  }

  get lifetimeSeconds(): number {
    return this.config.auth.jwtLifetimeSeconds;
  }

  issue(claims: SessionClaims): Promise<string> {
    return this.jwt.signAsync(claims, {
      secret: this.config.auth.jwtSecret,
      expiresIn: this.lifetimeSeconds,
    });
  }

  async verify(token: string): Promise<SessionClaims | null> {
    try {
      const payload = await this.jwt.verifyAsync<Record<string, unknown>>(token, {
        secret: this.config.auth.jwtSecret,
      });

      // El contenido de un token es entrada externa aunque la firma sea valida:
      // se comprueba su forma antes de darlo por bueno.
      const { sub, email, role } = payload;
      if (typeof sub !== 'string' || typeof email !== 'string' || typeof role !== 'string') {
        return null;
      }
      if (!isUserRole(role)) return null;

      return { sub, email, role };
    } catch {
      // Caducado, manipulado o firmado con otro secreto. Para el llamante
      // todos esos casos significan lo mismo: no hay sesion.
      return null;
    }
  }
}
