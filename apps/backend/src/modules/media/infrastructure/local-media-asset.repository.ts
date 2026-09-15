import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../../../config/app-config.js';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service.js';
import { NotFoundError } from '../../../shared/domain/domain-error.js';
import { MediaAsset } from '../domain/entities/media-asset.entity.js';
import {
  MediaAssetRepository,
  type StoredFile,
} from '../domain/repositories/media-asset.repository.js';

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
};

/**
 * Implementacion del puerto de archivos sobre el disco local.
 *
 * El nombre en disco siempre se genera con randomUUID y nunca reutiliza el
 * nombre que envio el cliente: eso descarta de raiz el recorrido de rutas
 * (subir algo llamado "../../.env") y las colisiones entre dos personas
 * subiendo un archivo con el mismo nombre.
 */
@Injectable()
export class LocalMediaAssetRepository extends MediaAssetRepository {
  private readonly logger = new Logger(LocalMediaAssetRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {
    super();
  }

  async save(file: StoredFile, uploadedById: string | null): Promise<MediaAsset> {
    const extension = EXTENSION_BY_MIME[file.mimeType] ?? (extname(file.originalName) || '.bin');
    const filename = `${randomUUID()}${extension}`;

    await mkdir(this.config.uploadsDir, { recursive: true });
    await writeFile(join(this.config.uploadsDir, filename), file.buffer);

    const url = `${this.config.publicAssetBaseUrl}/${filename}`;

    const row = await this.prisma.mediaAsset.create({
      data: {
        filename,
        originalName: file.originalName,
        mimeType: file.mimeType,
        sizeBytes: file.buffer.byteLength,
        url,
        uploadedById,
      },
    });

    return toDomain(row);
  }

  async findById(id: string): Promise<MediaAsset | null> {
    const row = await this.prisma.mediaAsset.findUnique({ where: { id } });
    return row === null ? null : toDomain(row);
  }

  async list(limit: number): Promise<MediaAsset[]> {
    const rows = await this.prisma.mediaAsset.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map(toDomain);
  }

  async delete(id: string): Promise<void> {
    const row = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (row === null) throw new NotFoundError('el archivo', id);

    await this.prisma.mediaAsset.delete({ where: { id } });

    try {
      await unlink(join(this.config.uploadsDir, row.filename));
    } catch (error) {
      // El registro ya se borro, que es lo que garantiza la coherencia del
      // listado. Un archivo huerfano en disco se limpia despues sin urgencia.
      this.logger.warn(`No se pudo borrar el archivo en disco ${row.filename}: ${String(error)}`);
    }
  }
}

interface AssetRow {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  createdAt: Date;
}

function toDomain(row: AssetRow): MediaAsset {
  return new MediaAsset({
    id: row.id,
    filename: row.filename,
    originalName: row.originalName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    url: row.url,
    createdAt: row.createdAt,
  });
}
