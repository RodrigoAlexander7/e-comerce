import type { Metadata } from "next";
import { CheckoutSteps } from "@/components/checkout/checkout-steps";
import { PaymentStep } from "@/components/checkout/payment-step";

export const metadata: Metadata = { title: "Metodo de pago" };

export default function CheckoutPagoPage() {
  return (
    <>
      <CheckoutSteps current={3} />
      <PaymentStep />
    </>
  );
}
