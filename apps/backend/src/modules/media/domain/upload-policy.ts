import { InvalidValueError } from '../../../shared/domain/domain-error.js';

/**
 * Reglas de admision de archivos subidos.
 *
 * Se valida el tipo MIME real que reporta el navegador y no la extension del
 * nombre de archivo, que cualquiera puede falsear renombrando un ejecutable a
 * ".jpg". El limite de tamano evita que una foto sin comprimir agote el disco.
 */
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
]);

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export function assertUploadAllowed(mimeType: string, sizeBytes: number): void {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new InvalidValueError(
      `Formato de imagen no admitido: "${mimeType}". Usa JPG, PNG, WEBP o SVG.`,
    );
  }
  if (sizeBytes > MAX_SIZE_BYTES) {
    throw new InvalidValueError('La imagen supera el tamano maximo de 5 MB.');
  }
  if (sizeBytes === 0) {
    throw new InvalidValueError('El archivo esta vacio.');
  }
}
