import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { CartProvider } from "@/lib/cart/cart-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

/**
 * Barlow Condensed sostiene los titulares: su ancho estrecho y su peso alto
 * dan el impacto de rotulo deportivo sin recurrir a mayusculas gigantes.
 * Barlow, la misma familia en ancho normal, mantiene la coherencia en el
 * texto corrido sin sacrificar legibilidad.
 */
const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Atlas Sport",
    template: "%s | Atlas Sport",
  },
  description:
    "Ropa deportiva de alto rendimiento. Polos, casacas, pantalones y shorts para entrenar y para el dia a dia.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-PE"
      className={`${barlowCondensed.variable} ${barlow.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        {/* Permite a quien navega con teclado saltarse la cabecera completa. */}
        <a href="#contenido" className="skip-link">
          Saltar al contenido principal
        </a>
        <CartProvider>
          <SiteHeader />
          <main id="contenido" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
