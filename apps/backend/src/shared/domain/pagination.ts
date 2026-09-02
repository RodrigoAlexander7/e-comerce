/** Parametros de paginacion ya normalizados por la capa de presentacion. */
export interface PageRequest {
  readonly page: number;
  readonly perPage: number;
}

/** Porcion de una coleccion junto al total real de coincidencias. */
export interface Page<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly perPage: number;
  readonly totalPages: number;
}

export function buildPage<T>(items: readonly T[], total: number, request: PageRequest): Page<T> {
  return {
    items,
    total,
    page: request.page,
    perPage: request.perPage,
    totalPages: Math.max(1, Math.ceil(total / request.perPage)),
  };
}

export function toSkipTake(request: PageRequest): { skip: number; take: number } {
  return { skip: (request.page - 1) * request.perPage, take: request.perPage };
}
