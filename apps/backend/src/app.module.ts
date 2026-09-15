import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/app-config.module.js';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module.js';
import { CatalogModule } from './modules/catalog/catalog.module.js';
import { CheckoutModule } from './modules/checkout/checkout.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { LocationsModule } from './modules/locations/locations.module.js';
import { MediaModule } from './modules/media/media.module.js';
import { SettingsModule } from './modules/settings/settings.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { AdminModule } from './modules/admin/admin.module.js';

/**
 * Composicion raiz de la aplicacion.
 *
 * Cada dominio de negocio entra como un modulo independiente. Lo unico global
 * es la configuracion validada y la conexion de base de datos.
 *
 * AuthModule se importa despues de los modulos que protege: registra
 * SessionGuard como APP_GUARD, y ese guardian pasa a exigirse en cualquier
 * ruta de la aplicacion que no se marque @Public(), sin que cada controlador
 * tenga que declararlo.
 */
@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    CatalogModule,
    MediaModule,
    SettingsModule,
    NotificationsModule,
    CheckoutModule,
    LocationsModule,
    AuthModule,
    AdminModule,
  ],
})
export class AppModule {}
