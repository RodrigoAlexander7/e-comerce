"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AddressFields } from "./address-fields";
import { OrderSummary } from "./order-summary";
import { CartIssues } from "./cart-issues";
import { ArrowRightIcon } from "@/components/icons";
import { useCheckout } from "@/lib/checkout/checkout-context";
import { useCartQuote } from "@/lib/checkout/use-cart-quote";
import { formatPrice } from "@/lib/format";
import { validateAddress } from "@/lib/checkout/validation";
import type { AddressForm } from "@/lib/checkout/checkout-context";
import type { Department, ShippingMethod } from "@/lib/api/types";

/**
 * Paso 2: metodo de entrega y direccion de facturacion.
 *
 * El coste del envio se suma al total en cuanto se elige una opcion, porque el
 * resumen se vuelve a pedir al servidor con el metodo seleccionado.
 */
export function DeliveryStep({
  methods,
  departments,
}: {
  methods: ShippingMethod[];
  departments: Department[];
}) {
  const router = useRouter();
  const { form, update, updateBillingAddress, isReady, hasDetails } = useCheckout();
  const { quote } = useCartQuote(form.shippingMethodId || undefined);
  const [errors, setErrors] = useState<Partial<Record<keyof AddressForm, string>>>({});

  // Sin los datos del paso 1 no hay nada que enviar: se vuelve atras en lugar
  // de mostrar un formulario que fallaria al confirmar.
  useEffect(() => {
    if (isReady && !hasDetails) router.replace("/checkout");
  }, [isReady, hasDetails, router]);

  // Preselecciona la primera opcion para que el resumen nunca muestre un total
  // sin envio en un paso cuyo proposito es precisamente elegirlo.
  useEffect(() => {
    if (isReady && form.shippingMethodId === "" && methods.length > 0) {
      update({ shippingMethodId: methods[0].id });
    }
  }, [isReady, form.shippingMethodId, methods, update]);

  function handleContinue() {
    if (!form.billingSameAsShipping) {
      const found = validateAddress(form.billingAddress);
      setErrors(found);
      if (Object.keys(found).length > 0) {
        document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
        return;
      }
    }
    router.push("/checkout/pago");
  }

  if (!isReady) {
    return <div className="h-96 animate-pulse bg-mist" aria-label="Cargando" />;
  }

  const address = form.shippingAddress;

  return (
    <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_22rem] lg:gap-16">
      <div className="flex flex-col gap-10">
        <section>
          <h1 className="font-display text-4xl">Metodo de entrega</h1>
          <p className="mt-2 text-sm text-muted">
            Para conocer los plazos de entrega, revisa el{" "}
            <Link href="/ayuda/envios" className="underline hover:text-ink">
              detalle de envios
            </Link>
            .
          </p>

          <fieldset className="mt-6 flex flex-col gap-3">
            <legend className="sr-only">Elige un metodo de entrega</legend>
            {methods.map((method) => {
              const selected = method.id === form.shippingMethodId;
              return (
                <label
                  key={method.id}
                  className={`flex cursor-pointer items-start gap-4 border p-5 transition-colors ${
                    selected ? "border-ink bg-canvas" : "border-line hover:border-ash"
                  }`}
                >
                  <input
                    type="radio"
                    name="shippingMethod"
                    value={method.id}
                    checked={selected}
                    onChange={() => update({ shippingMethodId: method.id })}
                    className="mt-1 size-4 cursor-pointer accent-[#c2410c]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-3">
                      <span className="text-base font-medium">{method.name}</span>
                      <span className="text-base font-semibold tabular-nums">
                        {method.isFree ? "Gratis" : formatPrice(method.priceCents)}
                      </span>
                    </span>
                    <span className="mt-2 block text-sm leading-relaxed text-muted">
                      {method.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </fieldset>
        </section>

        <section>
          <h2 className="font-display text-3xl">Direccion de entrega</h2>
          {/* Resumen no editable: para corregirlo se vuelve al paso 1, que es
              donde vive ese formulario, en vez de duplicarlo aqui. */}
          <div className="mt-5 flex items-start justify-between gap-4 border border-ink bg-canvas p-5">
            <div className="min-w-0">
              <p className="font-semibold">{form.customerName}</p>
              <p className="mt-2 text-sm leading-relaxed text-steel">
                {[address.street, address.apartment, address.district, address.city, address.state, address.country]
                  .filter((part) => part && part.trim() !== "")
                  .join(", ")}
              </p>
            </div>
            <Link
              href="/checkout"
              aria-label="Editar la direccion de entrega"
              className="label-caps shrink-0 underline transition-colors hover:text-accent"
            >
              Editar
            </Link>
          </div>
        </section>

        <section>
          <h2 className="font-display text-3xl">Direccion de facturacion</h2>

          <label className="mt-5 flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={form.billingSameAsShipping}
              onChange={(event) => update({ billingSameAsShipping: event.target.checked })}
              className="size-4 cursor-pointer accent-[#c2410c]"
            />
            <span className="text-base">Igual que la direccion de entrega</span>
          </label>

          {!form.billingSameAsShipping ? (
            <div className="mt-6 flex flex-col gap-6">
              <AddressFields
                idPrefix="billing"
                address={form.billingAddress}
                departments={departments}
                errors={errors}
                onChange={updateBillingAddress}
              />
            </div>
          ) : null}
        </section>
      </div>

      {quote ? (
        <OrderSummary items={quote.items} totals={quote.totals}>
          <div className="flex flex-col gap-4">
            {quote.issues.length > 0 ? <CartIssues issues={quote.issues} /> : null}
            <button
              type="button"
              onClick={handleContinue}
              className="label-caps inline-flex h-14 w-full cursor-pointer items-center justify-center gap-2 bg-accent px-9 text-paper transition-colors hover:bg-accent-strong"
            >
              Continuar
              <ArrowRightIcon className="size-4" />
            </button>
            <Link
              href="/carrito"
              className="label-caps text-center text-muted transition-colors hover:text-ink"
            >
              Volver al carrito
            </Link>
          </div>
        </OrderSummary>
      ) : (
        <div className="h-64 animate-pulse border border-line bg-mist" />
      )}
    </div>
  );
}
