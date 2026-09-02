import type { Metadata } from "next";
import { CheckoutProvider } from "@/lib/checkout/checkout-context";

export const metadata: Metadata = {
  // El checkout contiene datos personales a medio rellenar: nunca se indexa.
  robots: { index: false, follow: false },
};

/**
 * Contenedor de los tres pasos.
 *
 * El proveedor vive aqui y no en cada pagina para que el formulario sobreviva
 * al navegar entre pasos sin volver a montarse.
 */
export default function CheckoutLayout({ children }: LayoutProps<"/checkout">) {
  return (
    <CheckoutProvider>
      <div className="shell py-10 md:py-14">{children}</div>
    </CheckoutProvider>
  );
}
