import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Protege /admin en el borde de la aplicacion.
 *
 * En Next.js 16 este archivo reemplaza a middleware.ts. Su runtime es siempre
 * nodejs (no edge) y no admite configurarlo.
 *
 * No decodifica el JWT aqui: la cookie de sesion es httpOnly y el secreto que
 * la firma vive solo en el backend. En su lugar reenvia la cookie a
 * /api/auth/me y deja que el backend, que es quien de verdad conoce el rol
 * vigente de la cuenta, decida. Duplicar esa logica aqui la desincronizaria
 * en cuanto alguien cambiara un rol o revocara un acceso.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001/api';
  const cookie = request.headers.get('cookie');

  const response = await fetch(`${apiUrl}/auth/me`, {
    headers: cookie ? { cookie } : {},
    // La verificacion de acceso nunca debe servirse desde cache.
    cache: 'no-store',
  }).catch(() => null);

  if (!response || !response.ok) {
    return redirectToLogin(request);
  }

  const user = (await response.json()) as { role?: string };
  if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
    return redirectToLogin(request);
  }

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest): NextResponse {
  const destination = new URL('/cuenta', request.url);
  destination.searchParams.set('siguiente', request.nextUrl.pathname);
  return NextResponse.redirect(destination);
}

export const config = {
  matcher: '/admin/:path*',
};
