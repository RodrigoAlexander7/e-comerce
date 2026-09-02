import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { listCategories } from "@/lib/api/catalog";
import { CatalogView, type CatalogSearchParams } from "@/components/catalog/catalog-view";

/** Prerrenderiza una ruta por categoria activa en tiempo de compilacion. */
export async function generateStaticParams() {
  const categories = await listCategories().catch(() => []);
  return categories.map((category) => ({ categoria: category.slug }));
}

export async function generateMetadata(
  props: PageProps<"/tienda/[categoria]">,
): Promise<Metadata> {
  const { categoria } = await props.params;
  const categories = await listCategories().catch(() => []);
  const match = categories.find((category) => category.slug === categoria);

  if (!match) return { title: "Categoria no encontrada" };
  return {
    title: match.name,
    description: match.description ?? `Prendas de la categoria ${match.name}.`,
  };
}

export default async function CategoriaPage(props: PageProps<"/tienda/[categoria]">) {
  const [{ categoria }, searchParams] = await Promise.all([props.params, props.searchParams]);

  const categories = await listCategories();
  const match = categories.find((category) => category.slug === categoria);

  // Una categoria inexistente debe devolver 404 y no un listado vacio, que
  // seria indistinguible de una categoria real sin stock.
  if (!match) notFound();

  return (
    <CatalogView
      title={match.name}
      description={match.description}
      categorySlug={match.slug}
      basePath={`/tienda/${match.slug}`}
      searchParams={searchParams as CatalogSearchParams}
    />
  );
}
