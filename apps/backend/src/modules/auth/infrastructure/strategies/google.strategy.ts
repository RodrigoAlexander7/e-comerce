import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile } from 'passport-google-oauth20';
import { APP_CONFIG, type AppConfig } from '../../../../config/app-config.js';
import type { FederatedProfile } from '../../domain/repositories/user.repository.js';

/**
 * Estrategia de acceso con Google.
 *
 * Solo traduce el perfil que devuelve Google al tipo del dominio. Quien decide
 * si esa persona entra, con que rol y que ordenes adopta es el caso de uso, no
 * esta clase.
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    // passport-oauth2 exige un clientID y un clientSecret no vacios desde el
    // propio constructor, incluso si la ruta nunca se usa. Sin credenciales
    // reales (instalacion recien clonada, entorno de pruebas) se rellena con
    // un valor de relleno para que la aplicacion arranque igual: la ruta
    // /auth/google queda registrada pero GoogleConfiguredGuard la bloquea con
    // un mensaje claro antes de que Passport intente hablar con Google.
    super({
      clientID: config.auth.googleClientId || 'sin-configurar',
      clientSecret: config.auth.googleClientSecret || 'sin-configurar',
      callbackURL: config.auth.googleCallbackUrl,
      scope: ['email', 'profile'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile): FederatedProfile {
    const email = profile.emails?.[0]?.value;

    // Google puede devolver un perfil sin correo si el usuario no concedio ese
    // permiso. Sin correo no hay identidad utilizable ni forma de adoptar sus
    // compras como invitado, asi que se rechaza el acceso.
    if (!email) {
      throw new Error('La cuenta de Google no expuso un correo electronico.');
    }

    return {
      googleId: profile.id,
      email,
      name: profile.displayName || email.split('@')[0],
      avatarUrl: profile.photos?.[0]?.value ?? null,
    };
  }
}
