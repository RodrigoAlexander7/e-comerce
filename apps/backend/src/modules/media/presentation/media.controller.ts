import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadMediaUseCase } from '../application/upload-media.use-case.js';
import { MediaAssetRepository } from '../domain/repositories/media-asset.repository.js';
import { Roles } from '../../auth/presentation/decorators/roles.decorator.js';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator.js';
import type { User } from '../../auth/domain/entities/user.entity.js';
import { toMediaAssetView, type MediaAssetView } from './media.view-model.js';

/**
 * Subida y gestion de archivos del panel.
 *
 * Protegido con ADMIN completo: sirve tanto para imagenes de producto como
 * para el QR de pago, y ambas cosas son contenido publico de la tienda que
 * cualquier administrador debe poder actualizar.
 */
@Roles('ADMIN')
@Controller('admin/media')
export class MediaController {
  constructor(
    private readonly uploadMedia: UploadMediaUseCase,
    private readonly media: MediaAssetRepository,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: User,
  ): Promise<MediaAssetView> {
    if (!file) {
      throw new BadRequestException('No se recibio ningun archivo.');
    }

    const asset = await this.uploadMedia.execute(
      { buffer: file.buffer, originalName: file.originalname, mimeType: file.mimetype },
      user.id,
    );
    return toMediaAssetView(asset);
  }

  @Get()
  async list(@Query('limit') limit?: string): Promise<MediaAssetView[]> {
    const parsed = Number.parseInt(limit ?? '', 10);
    const assets = await this.media.list(Number.isNaN(parsed) ? 40 : Math.min(parsed, 100));
    return assets.map(toMediaAssetView);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ deleted: true }> {
    await this.media.delete(id);
    return { deleted: true };
  }
}
