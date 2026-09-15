import Link from "next/link";
import Image from "next/image";
import { listCategories, listProducts } from "@/lib/api/catalog";
import { ProductGrid } from "@/components/catalog/product-grid";
import { ButtonLink } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/icons";

export default async function HomePage() {
  // Ambas lecturas son independientes: pedirlas en paralelo evita encadenar
  // dos viajes de red antes de poder pintar nada.
  const [featured, categories] = await Promise.all([
    listProducts({ featured: true, perPage: 3, sort: "newest" }),
    listCategories(),
  ]);

  return (
    <>
      {/* --- Portada editorial --------------------------------------------- */}
      <section className="border-b border-line bg-canvas">
        <div className="shell grid items-center gap-12 py-20 md:py-28 lg:grid-cols-12 lg:gap-16 lg:py-32">
          <div className="lg:col-span-7">
            <p className="label-caps text-accent">Coleccion 2026</p>
            <h1 className="font-display mt-6 text-6xl sm:text-7xl lg:text-8xl xl:text-9xl">
              Entrena
              <br />
              sin excusas
            </h1>
            <p className="mt-8 max-w-md text-lg leading-relaxed text-steel">
              Prendas tecnicas construidas para el esfuerzo real. Tejidos que
              respiran, costuras que aguantan y cortes que no estorban.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href="/tienda" variant="primary" size="lg">
                Ver coleccion
                <ArrowRightIcon className="size-4" />
              </ButtonLink>
              <ButtonLink href="/tienda/casacas" variant="outline" size="lg">
                Casacas
              </ButtonLink>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative aspect-4/5 overflow-hidden bg-mist">
              <Image
                src="/products/casaca-cortavientos-ridge-negro.svg"
                alt="Casaca cortavientos de la coleccion 2026"
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                priority
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* --- Destacados ---------------------------------------------------- */}
      <section className="shell py-20 md:py-28">
        <div className="flex items-end justify-between gap-6 border-b border-line pb-6">
          <div>
            <p className="label-caps text-ash">Seleccion</p>
            <h2 className="font-display mt-2 text-4xl md:text-5xl">Lo mas pedido</h2>
          </div>
          <Link
            href="/tienda"
            className="label-caps hidden items-center gap-2 text-ink transition-colors hover:text-accent sm:inline-flex"
          >
            Ver todo
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>

        <div className="mt-12">
          <ProductGrid products={featured.items} />
        </div>
      </section>

      {/* --- Categorias ---------------------------------------------------- */}
      <section className="border-t border-line bg-canvas">
        <div className="shell py-20 md:py-28">
          <h2 className="font-display text-4xl md:text-5xl">Compra por categoria</h2>

          <ul className="mt-12 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/tienda/${category.slug}`}
                  className="group flex h-full flex-col justify-between gap-10 bg-paper p-8 transition-colors hover:bg-ink hover:text-paper"
                >
                  <div>
                    <h3 className="font-display text-3xl">{category.name}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted group-hover:text-ash">
                      {category.description}
                    </p>
                  </div>
                  <span className="label-caps inline-flex items-center gap-2">
                    {category.productCount}{" "}
                    {category.productCount === 1 ? "modelo" : "modelos"}
                    <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* --- Garantias ----------------------------------------------------- */}
      <section className="shell py-20 md:py-24">
        <ul className="grid gap-10 sm:grid-cols-3">
          {[
            {
              title: "Envio a todo el Peru",
              body: "Lima en 2 a 4 dias habiles. Provincias por agencia en 4 a 7 dias.",
            },
            {
              title: "Cambio de talla gratuito",
              body: "Treinta dias para cambiar la talla si la prenda no te queda.",
            },
            {
              title: "Pago con Yape, Plin o transferencia",
              body: "Confirmamos tu pedido apenas verificamos el abono.",
            },
          ].map((item) => (
            <li key={item.title} className="border-t border-ink pt-6">
              <h3 className="label-caps">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
