import type { Metadata } from "next";
import { CartView } from "@/components/checkout/cart-view";

export const metadata: Metadata = {
  title: "Carrito",
  // El carrito es personal: no aporta nada en un buscador y no debe indexarse.
  robots: { index: false, follow: false },
};

export default function CarritoPage() {
  return (
    <div className="shell py-12 md:py-16">
      <h1 className="font-display text-5xl md:text-6xl">Tu carrito</h1>
      <div className="mt-10">
        <CartView />
      </div>
    </div>
  );
}
