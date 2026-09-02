import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, listProducts } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/client";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { VariantSelector } from "@/components/catalog/variant-selector";
import { ProductGrid } from "@/components/catalog/product-grid";
import type { ProductDetail } from "@/lib/api/types";

/** Devuelve la prenda, o null si la API responde 404. */
async function findProduct(slug: string): Promise<ProductDetail | null> {
  try {
    return await getProduct(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    // Cualquier otro fallo (red caida, 500) debe propagarse: convertirlo en
    // 404 ocultaria una averia real detras de "producto no encontrado".
    throw error;
  }
}

export async function generateMetadata(
  props: PageProps<"/producto/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await findProduct(slug);

  if (!product) return { title: "Prenda no encontrada" };

  return {
    title: product.name,
    description: product.description.slice(0, 155),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 155),
      images: product.imageUrl ? [{ url: product.imageUrl }] : undefined,
    },
  };
}

export default async function ProductoPage(props: PageProps<"/producto/[slug]">) {
  const { slug } = await props.params;
  const product = await findProduct(slug);

  if (!product) notFound();

  // Se piden cuatro para poder descartar la prenda actual y conservar tres.
  const related = await listProducts({
    category: product.categorySlug,
    perPage: 4,
  }).catch(() => ({ items: [] }));

  const suggestions = related.items.filter((item) => item.id !== product.id).slice(0, 3);

  return (
    <div className="shell py-8 md:py-12">
      <nav aria-label="Ruta de navegacion" className="label-caps text-ash">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="transition-colors hover:text-ink">
              Inicio
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link
              href={`/tienda/${product.categorySlug}`}
              className="transition-colors hover:text-ink"
            >
              {product.categoryName}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-ink">{product.name}</li>
        </ol>
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:gap-20">
        <ProductGallery images={product.images} name={product.name} />

        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="label-caps text-ash">{product.categoryName}</p>
          <h1 className="font-display mt-3 text-5xl md:text-6xl">{product.name}</h1>

          <div className="mt-8">
            <VariantSelector
              variants={product.variants}
              basePriceCents={product.priceCents}
              productName={product.name}
              productSlug={product.slug}
              imageUrl={product.imageUrl}
            />
          </div>

          <div className="mt-12 border-t border-line pt-8">
            <h2 className="label-caps">Descripcion</h2>
            <p className="mt-4 text-base leading-relaxed text-steel">{product.description}</p>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-line pt-8 text-sm">
            <div>
              <dt className="label-caps text-ash">Envio</dt>
              <dd className="mt-2 text-steel">Lima en 2 a 4 dias habiles.</dd>
            </div>
            <div>
              <dt className="label-caps text-ash">Cambios</dt>
              <dd className="mt-2 text-steel">Cambio de talla gratuito por 30 dias.</dd>
            </div>
          </dl>
        </div>
      </div>

      {suggestions.length > 0 ? (
        <section className="mt-24 border-t border-line pt-16 md:mt-32">
          <h2 className="font-display text-4xl">Tambien de {product.categoryName}</h2>
          <div className="mt-10">
            <ProductGrid products={suggestions} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
