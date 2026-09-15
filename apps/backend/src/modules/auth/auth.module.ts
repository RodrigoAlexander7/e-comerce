import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CheckoutModule } from '../checkout/checkout.module.js';
import { UserRepository } from './domain/repositories/user.repository.js';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository.js';
import { TokenIssuer } from './application/ports/token-issuer.port.js';
import { JwtTokenIssuer } from './infrastructure/jwt-token-issuer.js';
import { GoogleStrategy } from './infrastructure/strategies/google.strategy.js';
import { AuthenticateWithGoogleUseCase } from './application/use-cases/authenticate-with-google.use-case.js';
import { GetCurrentUserUseCase } from './application/use-cases/get-current-user.use-case.js';
import { SessionGuard } from './presentation/guards/session.guard.js';
import { AuthController } from './presentation/auth.controller.js';

/**
 * Modulo de autenticacion y control de acceso.
 *
 * SessionGuard se registra aqui como APP_GUARD: se aplica a TODAS las rutas de
 * la aplicacion, incluidas las de otros modulos. Es la unica forma de que
 * proteger el panel de administracion sea real y no dependa de que cada
 * controlador recuerde anotarse con @UseGuards.
 */
@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    // Importa CheckoutModule por su puerto OrderRepository, para adoptar las
    // compras de invitado al iniciar sesion.
    CheckoutModule,
  ],
  controllers: [AuthController],
  providers: [
    { provide: UserRepository, useClass: PrismaUserRepository },
    { provide: TokenIssuer, useClass: JwtTokenIssuer },
    GoogleStrategy,
    AuthenticateWithGoogleUseCase,
    GetCurrentUserUseCase,
    { provide: APP_GUARD, useClass: SessionGuard },
  ],
  exports: [UserRepository, TokenIssuer, GetCurrentUserUseCase],
})
export class AuthModule {}
