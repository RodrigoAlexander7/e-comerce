import {
  CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../../../../config/app-config.js';

/**
 * Impide llegar a Passport cuando Google OAuth no esta configurado.
 *
 * Sin este guardian, pedir /auth/google en una instalacion sin credenciales
 * fallaria dentro de la libreria de Passport con un error interno confuso.
 * Aqui se detecta antes y se responde con un mensaje que dice exactamente que
 * variables faltan.
 */
@Injectable()
export class GoogleConfiguredGuard implements CanActivate {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  canActivate(_context: ExecutionContext): boolean {
    if (!this.config.auth.googleClientId || !this.config.auth.googleClientSecret) {
      throw new ServiceUnavailableException(
        'El acceso con Google no esta configurado en este servidor. ' +
          'Define GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET.',
      );
    }
    return true;
  }
}
