import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { APP_CONFIG, type AppConfig } from '../../../config/app-config.js';
import { AuthenticateWithGoogleUseCase } from '../application/use-cases/authenticate-with-google.use-case.js';
import { UserRepository } from '../domain/repositories/user.repository.js';
import type { FederatedProfile } from '../domain/repositories/user.repository.js';
import { isUserRole } from '../domain/entities/user.entity.js';
import { TokenIssuer } from '../application/ports/token-issuer.port.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { Public } from './decorators/roles.decorator.js';
import { SESSION_COOKIE } from './guards/session.guard.js';
import { GoogleConfiguredGuard } from './guards/google-configured.guard.js';
import { toUserView, type UserView } from './auth.view-model.js';
import type { User } from '../domain/entities/user.entity.js';

/**
 * Superficie HTTP de autenticacion.
 *
 * Todas las rutas son publicas dentro del guardian global: entrar y comprobar
 * si hay sesion son las dos acciones que, por definicion, ocurren antes de
 * tener una.
 */
@Public()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authenticate: AuthenticateWithGoogleUseCase,
    private readonly users: UserRepository,
    private readonly tokens: TokenIssuer,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  private setSessionCookie(res: Response, token: string): void {
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: this.config.auth.cookieSecure,
      sameSite: 'lax',
      domain: this.config.auth.cookieDomain,
      maxAge: this.config.auth.jwtLifetimeSeconds * 1000,
      path: '/',
    });
  }

  @Get('google')
  @UseGuards(GoogleConfiguredGuard, AuthGuard('google'))
  googleLogin(): void {
    // El guardian de Passport intercepta la peticion y redirige a Google;
    // este cuerpo nunca llega a ejecutarse.
  }

  @Get('google/callback')
  @UseGuards(GoogleConfiguredGuard, AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    const profile = req.user as FederatedProfile;
    const { token, linkedOrders } = await this.authenticate.execute(profile);
    this.setSessionCookie(res, token);

    const destination = new URL('/cuenta', this.config.frontendUrl);
    if (linkedOrders > 0) destination.searchParams.set('ordenesVinculadas', String(linkedOrders));
    res.redirect(destination.toString());
  }

  /**
   * Acceso sin Google para desarrollo y pruebas automatizadas.
   *
   * Nunca esta disponible salvo que ENABLE_DEV_LOGIN=true y el entorno no sea
   * de produccion (ver AppConfig.auth.devLoginEnabled). Responde 404 y no 403
   * cuando esta desactivada, para no delatar siquiera que la ruta existe.
   *
   * El parametro "role" solo tiene efecto aqui: la via real de Google jamas
   * deja elegir un rol, por eso ninguna otra ruta lo admite.
   */
  @Get('dev-login')
  async devLogin(
    @Query('email') email: string | undefined,
    @Query('role') role: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    if (!this.config.auth.devLoginEnabled) {
      throw new NotFoundException();
    }
    if (!email || !email.includes('@')) {
      throw new BadRequestException('Indica un correo valido en ?email=.');
    }
    if (role !== undefined && !isUserRole(role)) {
      throw new BadRequestException('El rol debe ser CUSTOMER, ADMIN o SUPERADMIN.');
    }

    // El token lleva el rol grabado en su propia firma: hay que asegurar la
    // cuenta y fijar el rol ANTES de emitirlo, o la cookie saldria con el rol
    // que tenia la cuenta un instante antes (CUSTOMER recien creada incluida).
    let user = await this.users.findOrCreateFromGoogle({
      googleId: `dev:${email.toLowerCase()}`,
      email,
      name: email.split('@')[0],
      avatarUrl: null,
    });

    if (role !== undefined && user.role !== role) {
      user = await this.users.updateRole(user.id, role);
    }

    const token = await this.tokens.issue({ sub: user.id, email: user.email, role: user.role });

    this.setSessionCookie(res, token);
    res.json({ ok: true, email: email.toLowerCase(), role: user.role });
  }

  @Get('me')
  me(@CurrentUser() user: User | null): UserView {
    // El guardian marca esta ruta como publica, asi que "sin sesion" no es un
    // error: es una respuesta valida que el frontend usa para decidir si
    // muestra "Iniciar sesion" o el nombre de la cuenta.
    if (user === null) {
      throw new UnauthorizedException('No hay sesion activa.');
    }
    return toUserView(user);
  }

  @Get('logout')
  logout(@Res() res: Response): void {
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.redirect(new URL('/', this.config.frontendUrl).toString());
  }
}
