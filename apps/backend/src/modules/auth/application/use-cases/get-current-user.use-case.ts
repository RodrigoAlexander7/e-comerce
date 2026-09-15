import { Injectable } from '@nestjs/common';
import type { User } from '../../domain/entities/user.entity.js';
import { UserRepository } from '../../domain/repositories/user.repository.js';

/**
 * Resuelve la cuenta del token.
 *
 * Se relee de la base de datos en lugar de confiar en lo que trae el token:
 * si a alguien se le retiro el rol de administrador o se desactivo su cuenta,
 * el cambio debe surtir efecto de inmediato y no cuando caduque su sesion.
 */
@Injectable()
export class GetCurrentUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(userId: string): Promise<User | null> {
    const user = await this.users.findById(userId);
    return user !== null && user.isActive ? user : null;
  }
}
