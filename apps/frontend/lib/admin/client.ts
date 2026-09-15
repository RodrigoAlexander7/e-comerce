"use client";

/**
 * Cliente HTTP del panel de administracion.
 *
 * A diferencia de lib/api/client.ts (catalogo y checkout publicos), este vive
 * en el navegador y manda `credentials: "include"` en cada peticion para que
 * viaje la cookie httpOnly de sesion. El backend responde con Access-Control-
 * Allow-Credentials porque ambos origenes comparten sitio (mismo dominio,
 * distinto puerto), asi que la cookie SameSite=Lax se envia sin problema.
 *
 * Nunca se cachea: el panel siempre debe ver el dato mas reciente, incluido
 * el que acaba de escribir el propio administrador.
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export class AdminApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { message?: string | string[] }) =>
        Array.isArray(body.message) ? body.message.join(", ") : body.message,
      )
      .catch(() => null);
    throw new AdminApiError(response.status, detail ?? response.statusText);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function adminGet<T>(path: string, params: Record<string, string | undefined> = {}): Promise<T> {
  // La cadena de consulta se arma a mano, sin pasar por el constructor URL:
  // resolver "path" contra BASE_URL y quedarse solo con pathname+search
  // duplicaria el prefijo /api al reconstruir la peticion dentro de request().
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, value);
  }
  const suffix = query.toString();
  return request<T>(suffix ? `${path}?${suffix}` : path);
}

export function adminPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined });
}

export function adminPatch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined });
}

export function adminDelete<T>(path: string): Promise<T> {
  return request<T>(path, { method: "DELETE" });
}

/** Subida de archivos: el cuerpo es FormData, nunca JSON. */
export async function adminUpload<T>(path: string, file: File): Promise<T> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { message?: string | string[] }) =>
        Array.isArray(body.message) ? body.message.join(", ") : body.message,
      )
      .catch(() => null);
    throw new AdminApiError(response.status, detail ?? response.statusText);
  }

  return response.json() as Promise<T>;
}
