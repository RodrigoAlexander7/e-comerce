import Link from "next/link";

const SECTIONS = [
  {
    title: "Tienda",
    links: [
      { label: "Polos", href: "/tienda/polos" },
      { label: "Casacas", href: "/tienda/casacas" },
      { label: "Pantalones", href: "/tienda/pantalones" },
      { label: "Shorts", href: "/tienda/shorts" },
    ],
  },
  {
    title: "Ayuda",
    links: [
      { label: "Guia de tallas", href: "/ayuda/tallas" },
      { label: "Envios y plazos", href: "/ayuda/envios" },
      { label: "Cambios y devoluciones", href: "/ayuda/devoluciones" },
      { label: "Contacto", href: "/ayuda/contacto" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre Atlas", href: "/nosotros" },
      { label: "Terminos y condiciones", href: "/legal/terminos" },
      { label: "Politica de privacidad", href: "/legal/privacidad" },
      { label: "Libro de reclamaciones", href: "/legal/reclamaciones" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-canvas">
      <div className="shell py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-3xl">Atlas Sport</p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Ropa deportiva disenada para entrenar duro y durar. Fabricada y
              distribuida en Peru.
            </p>
          </div>

          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="label-caps text-ink">{section.title}</h2>
              <ul className="mt-5 flex flex-col gap-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-line pt-8 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <p>Atlas Sport SAC. Todos los derechos reservados.</p>
          <p>Precios en soles con IGV incluido.</p>
        </div>
      </div>
    </footer>
  );
}
