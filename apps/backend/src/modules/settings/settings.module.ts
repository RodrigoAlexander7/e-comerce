import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module.js';
import { StoreSettingsRepository } from './domain/repositories/store-settings.repository.js';
import { PrismaStoreSettingsRepository } from './infrastructure/prisma-store-settings.repository.js';
import { GetStoreSettingsUseCase } from './application/use-cases/get-store-settings.use-case.js';
import { UpdateStoreSettingsUseCase } from './application/use-cases/update-store-settings.use-case.js';
import { SettingsController } from './presentation/settings.controller.js';

/**
 * Configuracion editable de la tienda.
 *
 * Se exporta StoreSettingsRepository porque checkout y notifications lo
 * consumen para saber a donde debe pagar el cliente y que numero de Yape
 * mostrar, sin conocer que esos datos viven en una tabla de una sola fila.
 * GetStoreSettingsUseCase se exporta ademas porque el propio controlador de
 * checkout lo inyecta directamente para armar las instrucciones de pago.
 */
@Module({
  imports: [MediaModule],
  controllers: [SettingsController],
  providers: [
    { provide: StoreSettingsRepository, useClass: PrismaStoreSettingsRepository },
    GetStoreSettingsUseCase,
    UpdateStoreSettingsUseCase,
  ],
  exports: [StoreSettingsRepository, GetStoreSettingsUseCase],
})
export class SettingsModule {}
