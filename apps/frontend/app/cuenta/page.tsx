import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/api/auth";
import { googleLoginUrl, logoutUrl } from "@/lib/auth-links";
import { ButtonLink } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Mi cuenta",
  robots: { index: false, follow: false },
};

/**
 * Acceso y perfil basico.
 *
 * No hay formulario de registro propio: la plataforma solo se identifica con
 * Google. Al entrar por primera vez, el backend crea la cuenta y adopta
 * cualquier compra que esa persona hizo antes como invitada con el mismo
 * correo, que es lo que anuncia el bloque de bienvenida tras iniciar sesion.
 */
export default async function CuentaPage(props: PageProps<"/cuenta">) {
  const params = await props.searchParams;
  const user = await getCurrentUser();
  const linkedOrders = Number.parseInt(
    typeof params.ordenesVinculadas === "string" ? params.ordenesVinculadas : "0",
    10,
  );
  const next = typeof params.siguiente === "string" ? params.siguiente : undefined;

  if (!user) {
    return (
      <div className="shell flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <p className="label-caps text-accent">Mi cuenta</p>
        <h1 className="font-display mt-4 text-5xl md:text-6xl">Iniciar sesion</h1>
        <p className="mt-6 max-w-sm text-base leading-relaxed text-muted">
          Entra con tu cuenta de Google para dar seguimiento a tus pedidos.
          Si compraste antes como invitado, tus ordenes se vinculan
          automaticamente por tu correo.
        </p>
        <a
          href={googleLoginUrl(next)}
          className="label-caps mt-10 inline-flex h-14 items-center gap-3 bg-ink px-8 text-paper transition-colors hover:bg-graphite"
        >
          <GoogleIcon />
          Continuar con Google
        </a>
      </div>
    );
  }

  return (
    <div className="shell py-16 md:py-20">
      <p className="label-caps text-accent">Mi cuenta</p>
      <h1 className="font-display mt-4 text-5xl md:text-6xl">Hola, {user.name}</h1>
      <p className="mt-3 text-base text-muted">{user.email}</p>

      {linkedOrders > 0 ? (
        <p className="mt-6 max-w-md border-l-4 border-accent bg-mist p-4 text-sm text-steel">
          Vinculamos {linkedOrders} {linkedOrders === 1 ? "orden que hiciste" : "ordenes que hiciste"} como
          invitado a tu cuenta.
        </p>
      ) : null}

      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink href="/tienda" variant="primary" size="lg">
          Ir a la tienda
          <ArrowRightIcon className="size-4" />
        </ButtonLink>
        {user.role === "ADMIN" || user.role === "SUPERADMIN" ? (
          <ButtonLink href="/admin" variant="outline" size="lg">
            Panel de administracion
          </ButtonLink>
        ) : null}
      </div>

      <div className="mt-16 border-t border-line pt-8">
        <Link href={logoutUrl()} className="label-caps text-muted underline hover:text-ink">
          Cerrar sesion
        </Link>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden focusable="false">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20.4H24v7.2h11.3c-1.6 4.6-6 7.9-11.3 7.9-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.1-5.1C33.6 5.9 29 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5Z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 5.9 4.3C13.9 15.4 18.6 12 24 12c3.1 0 5.8 1.1 8 3l5.1-5.1C33.6 5.9 29 4 24 4c-7.7 0-14.4 4.4-17.7 10.7Z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5 0 9.4-1.6 12.5-4.4l-5.8-4.9c-2 1.4-4.6 2.3-6.7 2.3-5.3 0-9.7-3.4-11.3-8.1l-6 4.6C9.5 39.6 16.2 44 24 44Z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20.4H24v7.2h11.3c-.8 2.2-2.2 4.1-4.1 5.4l5.8 4.9C40.6 34.9 44 30 44 24c0-1.2-.1-2.4-.4-3.5Z"
      />
    </svg>
  );
}
