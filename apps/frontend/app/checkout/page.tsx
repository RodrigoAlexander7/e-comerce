import type { Metadata } from "next";
import { listDepartments } from "@/lib/api/checkout";
import { CheckoutSteps } from "@/components/checkout/checkout-steps";
import { DetailsStep } from "@/components/checkout/details-step";

export const metadata: Metadata = { title: "Detalles del pedido" };

export default async function CheckoutDetallesPage() {
  // El catalogo geografico se resuelve en el servidor: son datos estables y
  // grandes, y pedirlos desde el navegador retrasaria el primer pintado.
  const departments = await listDepartments().catch(() => []);

  return (
    <>
      <CheckoutSteps current={1} />
      <DetailsStep departments={departments} />
    </>
  );
}
