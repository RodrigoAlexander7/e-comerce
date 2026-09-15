export interface MediaAssetProps {
  readonly id: string;
  readonly filename: string;
  readonly originalName: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly url: string;
  readonly createdAt: Date;
}

/** Archivo subido desde el panel de administracion (imagenes de producto, QR de pago). */
export class MediaAsset {
  readonly id: string;
  readonly filename: string;
  readonly originalName: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly url: string;
  readonly createdAt: Date;

  constructor(props: MediaAssetProps) {
    this.id = props.id;
    this.filename = props.filename;
    this.originalName = props.originalName;
    this.mimeType = props.mimeType;
    this.sizeBytes = props.sizeBytes;
    this.url = props.url;
    this.createdAt = props.createdAt;
  }
}
