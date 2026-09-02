import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { MediaAssetRepository } from './domain/repositories/media-asset.repository.js';
import { LocalMediaAssetRepository } from './infrastructure/local-media-asset.repository.js';
import { UploadMediaUseCase } from './application/upload-media.use-case.js';
import { MediaController } from './presentation/media.controller.js';

/**
 * Almacenamiento de archivos subidos desde el panel.
 *
 * Se usa memoryStorage y no diskStorage de Multer: el archivo llega entero a
 * memoria, la politica de admision (tipo y tamano) se valida en el dominio
 * antes de tocar el disco, y solo entonces LocalMediaAssetRepository decide
 * donde y con que nombre se escribe.
 */
@Module({
  imports: [
    MulterModule.register({
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  ],
  controllers: [MediaController],
  providers: [
    { provide: MediaAssetRepository, useClass: LocalMediaAssetRepository },
    UploadMediaUseCase,
  ],
  exports: [MediaAssetRepository],
})
export class MediaModule {}
