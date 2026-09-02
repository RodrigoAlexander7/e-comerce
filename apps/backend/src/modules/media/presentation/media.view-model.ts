import type { MediaAsset } from '../domain/entities/media-asset.entity.js';

export interface MediaAssetView {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  createdAt: string;
}

export function toMediaAssetView(asset: MediaAsset): MediaAssetView {
  return {
    id: asset.id,
    originalName: asset.originalName,
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
    url: asset.url,
    createdAt: asset.createdAt.toISOString(),
  };
}
