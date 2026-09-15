"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OrderSummary } from "./order-summary";
import { CartIssues } from "./cart-issues";
import { BankIcon, PhoneIcon } from "@/components/icons";
import { useCheckout } from "@/lib/checkout/checkout-context";
import { useCartQuote } from "@/lib/checkout/use-cart-quote";
import { useCart } from "@/lib/cart/cart-context";
import { placeOrder } from "@/lib/api/checkout";
import type { PaymentMethod } from "@/lib/api/types";
import type { AddressForm } from "@/lib/checkout/checkout-context";

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: "phone" | "bank" }[] = [
  { value: "YAPE_PLIN", label: "Pago con Yape o Plin", icon: "phone" },
  { value: "BANK_TRANSFER", label: "Transferencia bancaria", icon: "bank" },
];

/**
 * Paso 3: metodo de pago y confirmacion.
 *
 * Ambos medios son offline: la tienda no cobra, solo registra la orden y espera
 * a que el cliente acredite el abono. Por eso el boton dice "Pagar ahora" pero
 * lo que hace es crear la orden y llevar a las instrucciones de pago.
 */
export function PaymentStep() {
  const router = useRouter();
  const { form, update, isReady, hasDelivery, reset } = useCheckout();
  const { lines, clear } = useCart();
  const { quote } = useCartQuote(form.shippingMethodId || undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaced, setIsPlaced] = useState(false);

  // Guardian del paso: sin los datos de entrega no hay nada que cobrar.
  //
  // Deja de vigilar en cuanto la orden se registra, porque justo despues se
  // vacian el carrito y el formulario. Sin esa condicion, el guardian veria el
  // estado ya limpio, lo interpretaria como un checkout incompleto y devolveria
  // al paso 2, cancelando la navegacion hacia la pagina de confirmacion.
  useEffect(() => {
    if (isReady && !hasDelivery && !isPlaced) router.replace("/checkout/entrega");
  }, [isReady, hasDelivery, isPlaced, router]);

  async function submit() {
    if (!form.acceptedTerms || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await placeOrder({
        lines: lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
        shippingMethodId: form.shippingMethodId,
        paymentMethod: form.paymentMethod,
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        customerPhone: form.customerPhone.trim(),
        idType: form.idType,
        idNumber: form.idNumber.trim(),
        needsInvoice: form.needsInvoice,
        ...(form.needsInvoice
          ? { businessName: form.businessName.trim(), ruc: form.ruc.trim() }
          : {}),
        shippingAddress: toPayload(form.shippingAddress),
        ...(form.billingSameAsShipping
          ? {}
          : { billingAddress: toPayload(form.billingAddress) }),
      });

      // El carrito y el formulario se vacian solo despues de que el servidor
      // confirme la orden: fallar antes dejaria al cliente sin nada.
      const email = form.customerEmail.trim();
      setIsPlaced(true);
      clear();
      reset();
      router.replace(
        `/checkout/confirmacion?numero=${response.order.number}&correo=${encodeURIComponent(email)}`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos registrar tu pedido. Intentalo de nuevo.",
      );
      setIsSubmitting(false);
    }
  }

  if (!isReady) {
    return <div className="h-96 animate-pulse bg-mist" aria-label="Cargando" />;
  }

  const address = form.shippingAddress;
  const billing = form.billingSameAsShipping ? address : form.billingAddress;

  return (
    <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_22rem] lg:gap-16">
      <div className="flex flex-col gap-10">
        <section>
          <h1 className="font-display text-4xl">Metodo de pago</h1>
          <p className="mt-2 text-sm text-muted">
            Registramos tu pedido y te enviamos las instrucciones para pagar.
          </p>

          <fieldset className="mt-6 flex flex-col gap-3">
            <legend className="sr-only">Elige un metodo de pago</legend>
            {PAYMENT_OPTIONS.map((option) => {
              const selected = option.value === form.paymentMethod;
              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-4 border p-5 transition-colors ${
                    selected ? "border-ink bg-canvas" : "border-line hover:border-ash"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={option.value}
                    checked={selected}
                    onChange={() => update({ paymentMethod: option.value })}
                    className="size-4 cursor-pointer accent-[#c2410c]"
                  />
                  <span className="flex-1 text-base font-medium">{option.label}</span>
                  {option.icon === "phone" ? (
                    <PhoneIcon className="size-6 text-steel" />
                  ) : (
                    <BankIcon className="size-6 text-steel" />
                  )}
                </label>
              );
            })}
          </fieldset>
        </section>

        <section className="border border-line p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <span className="label-caps rounded-full border border-line px-3 py-1 text-steel">
              Entrega y facturacion
            </span>
            <Link
              href="/carrito"
              className="label-caps bg-ink px-4 py-2.5 text-paper transition-colors hover:bg-graphite"
            >
              Regresar al carrito
            </Link>
          </div>

          <p className="mt-6 font-semibold">{form.customerName}</p>
          <address className="mt-2 text-sm not-italic leading-relaxed text-steel">
            {[address.street, address.apartment, address.district, address.city, address.state, address.country]
              .filter((part) => part && part.trim() !== "")
              .map((part) => (
                <span key={part} className="block">
                  {part}
                </span>
              ))}
          </address>

          {!form.billingSameAsShipping ? (
            <>
              <p className="mt-6 label-caps">Direccion de facturacion</p>
              <address className="mt-2 text-sm not-italic leading-relaxed text-steel">
                {[billing.street, billing.apartment, billing.district, billing.city, billing.state, billing.country]
                  .filter((part) => part && part.trim() !== "")
                  .join(", ")}
              </address>
            </>
          ) : null}

          {form.needsInvoice ? (
            <div className="mt-6">
              <p className="label-caps">Datos para la factura</p>
              <p className="mt-2 text-sm leading-relaxed text-steel">
                Razon Social: {form.businessName}
                <br />
                Numero de RUC: {form.ruc}
              </p>
            </div>
          ) : null}
        </section>
      </div>

      {quote ? (
        <OrderSummary items={quote.items} totals={quote.totals}>
          <div className="flex flex-col gap-5">
            {quote.issues.length > 0 ? <CartIssues issues={quote.issues} /> : null}

            {error ? (
              <p role="alert" className="border-l-4 border-danger bg-mist p-4 text-sm text-steel">
                {error}
              </p>
            ) : null}

            <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
              <input
                type="checkbox"
                checked={form.acceptedTerms}
                onChange={(event) => update({ acceptedTerms: event.target.checked })}
                className="mt-1 size-4 shrink-0 cursor-pointer accent-[#c2410c]"
              />
              <span>
                Estoy de acuerdo con los{" "}
                <Link href="/legal/terminos" className="underline hover:text-accent">
                  terminos y condiciones
                </Link>{" "}
                y confirmo que los datos ingresados son correctos.
              </span>
            </label>

            <button
              type="button"
              onClick={submit}
              disabled={!form.acceptedTerms || isSubmitting || quote.items.length === 0}
              className="label-caps inline-flex h-14 w-full cursor-pointer items-center justify-center bg-accent px-9 text-paper transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? "Registrando pedido..." : "Pagar ahora"}
            </button>

            <Link
              href="/checkout/entrega"
              className="label-caps text-center text-muted transition-colors hover:text-ink"
            >
              Regresar a la informacion adicional
            </Link>
          </div>
        </OrderSummary>
      ) : (
        <div className="h-64 animate-pulse border border-line bg-mist" />
      )}
    </div>
  );
}

function toPayload(address: AddressForm) {
  return {
    country: address.country,
    state: address.state,
    city: address.city,
    district: address.district,
    street: address.street,
    ...(address.apartment.trim() !== "" ? { apartment: address.apartment } : {}),
  };
}
