import { Global, Module } from '@nestjs/common';
import { APP_CONFIG, loadAppConfig } from './app-config.js';

/**
 * Expone la configuracion ya validada a toda la aplicacion.
 *
 * Es global porque practicamente cualquier modulo de infraestructura la
 * necesita (base de datos, correo, autenticacion) y obligar a importarla en
 * cada uno solo anadiria ruido sin ganar aislamiento real.
 */
@Global()
@Module({
  providers: [
    {
      provide: APP_CONFIG,
      // Se ejecuta una sola vez al arrancar: si falta una variable critica el
      // proceso no llega a aceptar peticiones.
      useFactory: loadAppConfig,
    },
  ],
  exports: [APP_CONFIG],
})
export class AppConfigModule {}
