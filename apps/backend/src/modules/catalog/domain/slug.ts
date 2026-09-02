/**
 * Convierte un nombre en un slug URL-seguro: minusculas, sin acentos, guiones
 * en vez de espacios. Se usa al crear una prenda o categoria desde el panel
 * cuando el administrador no escribe uno a mano.
 */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita acentos ya separados por NFD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
