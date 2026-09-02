/**
 * Cliente HTTP hacia la API de NestJS.
 *
 * Centraliza la URL base, el manejo de errores y la politica de cache para que
 * ninguna pagina construya peticiones a mano.
 */

const BASE_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

/** Error de una respuesta no satisfactoria, con el codigo HTTP conservado. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  /**
   * Segundos que Next puede servir la respuesta desde cache antes de
   * revalidarla. El catalogo tolera algo de retraso, asi que se cachea; el
   * carrito y el checkout no deben pasar por aqui.
   */
  revalidate?: number;
  tags?: string[];
}

export async function apiGet<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
  options: RequestOptions = {},
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    next: {
      revalidate: options.revalidate ?? 60,
      ...(options.tags ? { tags: options.tags } : {}),
    },
  });

  if (!response.ok) {
    // El backend devuelve { message } en sus errores de dominio y validacion;
    // si la respuesta no fuese JSON se cae al texto de estado.
    const detail = await response
      .json()
      .then((body: { message?: string | string[] }) =>
        Array.isArray(body.message) ? body.message.join(", ") : body.message,
      )
      .catch(() => null);

    throw new ApiError(response.status, detail ?? response.statusText);
  }

  return response.json() as Promise<T>;
}

/**
 * Peticion con cuerpo hacia la API.
 *
 * Nunca se cachea: el checkout debe ver el stock y los precios del instante,
 * no una respuesta guardada de hace un minuto.
 */
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response
      .json()
      .then((payload: { message?: string | string[] }) =>
        Array.isArray(payload.message) ? payload.message.join(", ") : payload.message,
      )
      .catch(() => null);

    throw new ApiError(response.status, detail ?? response.statusText);
  }

  return response.json() as Promise<T>;
}
