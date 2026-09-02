import { cookies } from "next/headers";
import { ApiError } from "./client";
import type { SessionUser } from "./types";

/**
 * Sesion vigente, para usar solo en Componentes de Servidor.
 *
 * `fetch` en el servidor no tiene acceso al cookie jar del navegador: la
 * cookie de sesion httpOnly hay que leerla del propio request entrante (via
 * `next/headers`) y reenviarla a mano en la peticion al backend. Sin este
 * paso, cada renderizado en servidor veria a todo el mundo como invitado.
 *
 * No se cachea: un cambio de rol o un cierre de sesion en otra pestana deben
 * reflejarse de inmediato, no en la siguiente revalidacion.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const base = process.env.API_URL ?? "http://localhost:3001/api";
  const cookieHeader = (await cookies()).toString();

  try {
    const response = await fetch(`${base}/auth/me`, {
      headers: cookieHeader ? { cookie: cookieHeader } : {},
      cache: "no-store",
    });

    if (response.status === 401) return null;
    if (!response.ok) throw new ApiError(response.status, response.statusText);

    return (await response.json()) as SessionUser;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // Backend inalcanzable: se trata igual que "sin sesion" para no tumbar
    // paginas publicas que solo usan esto para decidir que boton mostrar.
    return null;
  }
}
