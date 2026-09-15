import Link from "next/link";
import { listCategories } from "@/lib/api/catalog";
import { getCurrentUser } from "@/lib/api/auth";
import { SearchIcon, UserIcon } from "@/components/icons";
import { CartButton } from "@/components/cart-button";
import { MobileNav } from "@/components/mobile-nav";

/**
 * Cabecera de la tienda.
 *
 * Es un componente de servidor: las categorias y la sesion se leen durante el
 * renderizado, sin exponer una peticion adicional desde el navegador. Solo el
 * panel desplegable en movil necesita interactividad y vive en su propio
 * componente de cliente.
 */
export async function SiteHeader() {
  // La cabecera no debe tumbar la pagina entera si el catalogo o la sesion no
  // responden: ante un fallo se degrada a la navegacion minima o a invitado.
  const [categories, user] = await Promise.all([
    listCategories().catch(() => []),
    getCurrentUser().catch(() => null),
  ]);
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur">
      <div className="shell flex h-16 items-center justify-between gap-6 md:h-20">
        <div className="flex items-center gap-8">
          <MobileNav categories={categories} />

          <Link href="/" className="font-display text-2xl tracking-tight md:text-3xl">
            Atlas Sport
          </Link>

          <nav aria-label="Categorias" className="hidden lg:block">
            <ul className="flex items-center gap-7">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/tienda/${category.slug}`}
                    className="label-caps text-steel transition-colors hover:text-ink"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/tienda"
                  className="label-caps text-steel transition-colors hover:text-ink"
                >
                  Todo
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href="/tienda"
            aria-label="Buscar prendas"
            className="grid size-11 place-items-center text-ink transition-colors hover:bg-mist"
          >
            <SearchIcon className="size-5" />
          </Link>
          {isAdmin ? (
            <Link
              href="/admin"
              className="label-caps hidden items-center bg-ink px-3.5 py-2 text-paper transition-colors hover:bg-graphite sm:inline-flex"
            >
              Panel
            </Link>
          ) : null}
          <Link
            href="/cuenta"
            aria-label={user ? `Cuenta de ${user.name}` : "Iniciar sesion"}
            title={user ? user.name : "Iniciar sesion"}
            className="hidden size-11 place-items-center text-ink transition-colors hover:bg-mist sm:grid"
          >
            <UserIcon className="size-5" />
          </Link>
          <CartButton />
        </div>
      </div>
    </header>
  );
}
