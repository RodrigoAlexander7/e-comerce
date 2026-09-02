import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findOrder } from "@/lib/api/checkout";
import { ApiError } from "@/lib/api/client";
import { OrderConfirmation } from "@/components/checkout/order-confirmation";

export const metadata: Metadata = {
  title: "Pedido confirmado",
  robots: { index: false, follow: false },
};

export default async function ConfirmacionPage(
  props: PageProps<"/checkout/confirmacion">,
) {
  const params = await props.searchParams;
  const numero = typeof params.numero === "string" ? params.numero : "";
  const correo = typeof params.correo === "string" ? params.correo : "";

  if (numero === "" || correo === "") notFound();

  // El backend exige numero y correo a la vez: el codigo por si solo es
  // correlativo y no basta para autorizar la lectura de datos personales.
  const response = await findOrder(numero, correo).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  });

  if (response === null) notFound();

  return <OrderConfirmation order={response.order} payment={response.payment} />;
}
