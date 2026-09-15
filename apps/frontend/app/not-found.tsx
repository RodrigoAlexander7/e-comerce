import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="shell flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="label-caps text-accent">Error 404</p>
      <h1 className="font-display mt-6 text-6xl md:text-7xl">Pagina no encontrada</h1>
      <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
        La direccion que buscas no existe o la prenda ya no esta en catalogo.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/tienda" variant="primary" size="lg">
          Ver catalogo
        </ButtonLink>
        <ButtonLink href="/" variant="outline" size="lg">
          Volver al inicio
        </ButtonLink>
      </div>
    </div>
  );
}
