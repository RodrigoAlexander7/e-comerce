import { Injectable, Logger } from '@nestjs/common';
import { BusinessRuleError } from '../../../../shared/domain/domain-error.js';
import type { User } from '../../domain/entities/user.entity.js';
import {
  UserRepository,
  type FederatedProfile,
} from '../../domain/repositories/user.repository.js';
import { OrderRepository } from '../../../checkout/domain/repositories/order.repository.js';
import { TokenIssuer } from '../ports/token-issuer.port.js';

export interface AuthenticationResult {
  readonly user: User;
  readonly token: string;
  /** Ordenes de invitado que se vincularon a la cuenta en este acceso. */
  readonly linkedOrders: number;
}

/**
 * Inicia sesion con Google y emite la credencial de la plataforma.
 *
 * Al entrar se adoptan las ordenes que esa misma persona hizo como invitada,
 * identificadas por el correo de la compra. Es lo que convierte el "Registrarse
 * para dar seguimiento a tu orden" de la pagina de confirmacion en algo real.
 */
@Injectable()
export class AuthenticateWithGoogleUseCase {
  private readonly logger = new Logger(AuthenticateWithGoogleUseCase.name);

  constructor(
    private readonly users: UserRepository,
    private readonly orders: OrderRepository,
    private readonly tokens: TokenIssuer,
  ) {}

  async execute(profile: FederatedProfile): Promise<AuthenticationResult> {
    const user = await this.users.findOrCreateFromGoogle(profile);

    if (!user.isActive) {
      throw new BusinessRuleError(
        'Esta cuenta esta desactivada. Ponte en contacto con la tienda.',
      );
    }

    const token = await this.tokens.issue({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Vincular ordenes es una cortesia, no un requisito para entrar: si falla,
    // el acceso debe completarse igualmente.
    let linkedOrders = 0;
    try {
      linkedOrders = await this.orders.attachGuestOrdersByEmail(user.email, user.id);
    } catch (error) {
      this.logger.error(
        `No se pudieron vincular las ordenes de invitado de ${user.email}.`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    return { user, token, linkedOrders };
  }
}
