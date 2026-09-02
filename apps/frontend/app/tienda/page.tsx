import type { Metadata } from "next";
import { CatalogView, type CatalogSearchParams } from "@/components/catalog/catalog-view";

export const metadata: Metadata = {
  title: "Tienda",
  description: "Todo el catalogo de Atlas Sport: polos, casacas, pantalones y shorts.",
};

export default async function TiendaPage(props: PageProps<"/tienda">) {
  // En Next 16 searchParams es una promesa: el acceso sincrono se retiro.
  const searchParams = (await props.searchParams) as CatalogSearchParams;

  return (
    <CatalogView
      title="Todo el catalogo"
      description="Prendas tecnicas para entrenamiento y uso diario."
      basePath="/tienda"
      searchParams={searchParams}
    />
  );
}
