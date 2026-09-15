/**
 * Enlaces de autenticacion, isomorficos (server y cliente).
 *
 * Separados de lib/api/auth.ts porque ese archivo importa `next/headers` para
 * leer la cookie de sesion en Componentes de Servidor: mezclar ambos en un
 * mismo modulo rompe cualquier Componente de Cliente que solo necesite estas
 * dos URLs, como el boton de cerrar sesion del panel.
 */

/** URL del backend que arranca el flujo de Google. Es una navegacion completa, no un fetch. */
export function googleLoginUrl(nextPath?: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
  const url = new URL(`${base}/auth/google`);
  if (nextPath) url.searchParams.set("state", nextPath);
  return url.toString();
}

export function logoutUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
  return `${base}/auth/logout`;
}
