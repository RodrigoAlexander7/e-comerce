import type { MediaAsset } from '../entities/media-asset.entity.js';

export interface StoredFile {
  readonly buffer: Buffer;
  readonly originalName: string;
  readonly mimeType: string;
}

/**
 * Puerto de almacenamiento de archivos.
 *
 * `save` cubre tanto escribir el archivo en disco como registrarlo en base de
 * datos: son la misma operacion desde la perspectiva de quien sube algo, y
 * separarlas en dos pasos dejaria una ventana en la que el archivo existe en
 * disco pero no aparece en el listado, o al reves.
 */
export abstract class MediaAssetRepository {
  abstract save(file: StoredFile, uploadedById: string | null): Promise<MediaAsset>;
  abstract findById(id: string): Promise<MediaAsset | null>;
  abstract list(limit: number): Promise<MediaAsset[]>;
  abstract delete(id: string): Promise<void>;
}
