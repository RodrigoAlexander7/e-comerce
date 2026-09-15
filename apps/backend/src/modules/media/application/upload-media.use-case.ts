import { Injectable } from '@nestjs/common';
import type { MediaAsset } from '../domain/entities/media-asset.entity.js';
import {
  MediaAssetRepository,
  type StoredFile,
} from '../domain/repositories/media-asset.repository.js';
import { assertUploadAllowed } from '../domain/upload-policy.js';

/** Recibe un archivo del panel de administracion y lo guarda. */
@Injectable()
export class UploadMediaUseCase {
  constructor(private readonly media: MediaAssetRepository) {}

  execute(file: StoredFile, uploadedById: string | null): Promise<MediaAsset> {
    assertUploadAllowed(file.mimeType, file.buffer.byteLength);
    return this.media.save(file, uploadedById);
  }
}
