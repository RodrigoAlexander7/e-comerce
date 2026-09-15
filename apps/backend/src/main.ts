// Debe ser el primer import: rellena process.env antes que nada mas.
import './config/load-env.js';

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { APP_CONFIG, type AppConfig } from './config/app-config.js';
import { DomainErrorFilter } from './shared/presentation/filters/domain-error.filter.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get<AppConfig>(APP_CONFIG);

  app.setGlobalPrefix('api');
  // La sesion viaja en una cookie httpOnly firmada; sin este middleware el
  // guardian de sesion no puede leerla.
  app.use(cookieParser());

  // Las imagenes subidas desde el panel (fotos de producto, QR de pago) se
  // sirven fuera del prefijo /api: son archivos estaticos, no endpoints.
  app.useStaticAssets(config.uploadsDir, { prefix: '/static/' });

  app.useGlobalPipes(
    new ValidationPipe({
      // Descarta cualquier campo no declarado en el DTO en lugar de dejarlo
      // llegar a la capa de aplicacion.
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.useGlobalFilters(new DomainErrorFilter());

  app.enableCors({
    origin: config.frontendUrl,
    credentials: true,
  });

  await app.listen(config.port);
  new Logger('Bootstrap').log(`API escuchando en http://localhost:${config.port}/api`);
}

await bootstrap();
