import type { Metadata } from "next";
import { listDepartments, listShippingMethods } from "@/lib/api/checkout";
import { CheckoutSteps } from "@/components/checkout/checkout-steps";
import { DeliveryStep } from "@/components/checkout/delivery-step";

export const metadata: Metadata = { title: "Metodo de entrega" };

export default async function CheckoutEntregaPage() {
  const [methods, departments] = await Promise.all([
    listShippingMethods(),
    listDepartments().catch(() => []),
  ]);

  return (
    <>
      <CheckoutSteps current={2} />
      <DeliveryStep methods={methods} departments={departments} />
    </>
  );
}
