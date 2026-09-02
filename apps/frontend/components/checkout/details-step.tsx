"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, inputClass, selectClass } from "@/components/ui/field";
import { ButtonLink } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/icons";
import { AddressFields } from "./address-fields";
import { OrderSummary } from "./order-summary";
import { CartIssues } from "./cart-issues";
import { useCheckout } from "@/lib/checkout/checkout-context";
import { useCartQuote } from "@/lib/checkout/use-cart-quote";
import { useCart } from "@/lib/cart/cart-context";
import { validateDetails, hasErrors, type DetailsErrors } from "@/lib/checkout/validation";
import type { Department, IdentificationType } from "@/lib/api/types";

const ID_TYPES: { value: IdentificationType; label: string }[] = [
  { value: "DNI", label: "DNI" },
  { value: "CE", label: "Carne de extranjeria" },
  { value: "PASSPORT", label: "Pasaporte" },
  { value: "RUC", label: "RUC" },
];

/**
 * Paso 1: datos de contacto, identificacion, facturacion y direccion de envio.
 *
 * Los errores no se muestran mientras se escribe por primera vez, sino al
 * intentar continuar: sennalar en rojo un correo a medio teclear es hostil.
 */
export function DetailsStep({ departments }: { departments: Department[] }) {
  const router = useRouter();
  const { form, update, updateShippingAddress, isReady } = useCheckout();
  const { lines, isReady: cartReady } = useCart();
  const { quote } = useCartQuote();
  const [errors, setErrors] = useState<DetailsErrors>({});

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const found = validateDetails(form);
    setErrors(found);

    if (hasErrors(found)) {
      // Lleva el foco al primer campo con problema, para no obligar a buscarlo.
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    router.push("/checkout/entrega");
  }

  if (!isReady || !cartReady) {
    return <div className="h-96 animate-pulse bg-mist" aria-label="Cargando" />;
  }

  if (lines.length === 0) {
    return (
      <div className="border border-line py-24 text-center">
        <p className="font-display text-3xl">Tu carrito esta vacio</p>
        <p className="mt-3 text-sm text-muted">Anade prendas antes de continuar.</p>
        <div className="mt-8">
          <ButtonLink href="/tienda" variant="primary" size="lg">
            Ver catalogo
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_22rem] lg:gap-16">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-4xl">Detalles</h1>
          <p className="flex items-center gap-3 text-sm text-muted">
            <span>Ya tienes una cuenta?</span>
            {/* La sesion con Google llega en la fase de autenticacion; hasta
                entonces el enlace lleva al acceso, que la anunciara. */}
            <Link
              href="/cuenta"
              className="label-caps bg-ink px-4 py-2.5 text-paper transition-colors hover:bg-graphite"
            >
              Iniciar sesion
            </Link>
          </p>
        </div>

        <Field
          label="Tu nombre"
          htmlFor="customerName"
          required
          error={errors.customerName}
        >
          <input
            id="customerName"
            className={inputClass}
            value={form.customerName}
            autoComplete="name"
            aria-invalid={errors.customerName ? true : undefined}
            onChange={(event) => update({ customerName: event.target.value })}
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="Correo electronico"
            htmlFor="customerEmail"
            required
            error={errors.customerEmail}
            hint="Ahi enviaremos las instrucciones de pago."
          >
            <input
              id="customerEmail"
              type="email"
              inputMode="email"
              className={inputClass}
              value={form.customerEmail}
              autoComplete="email"
              aria-invalid={errors.customerEmail ? true : undefined}
              onChange={(event) => update({ customerEmail: event.target.value })}
            />
          </Field>

          <Field
            label="Telefono"
            htmlFor="customerPhone"
            required
            error={errors.customerPhone}
          >
            <input
              id="customerPhone"
              type="tel"
              inputMode="tel"
              className={inputClass}
              value={form.customerPhone}
              autoComplete="tel"
              aria-invalid={errors.customerPhone ? true : undefined}
              onChange={(event) => update({ customerPhone: event.target.value })}
            />
          </Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Tipo de Identificacion" htmlFor="idType" required>
            <select
              id="idType"
              className={selectClass}
              value={form.idType}
              onChange={(event) =>
                update({ idType: event.target.value as IdentificationType })
              }
            >
              {ID_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Numero de Identificacion"
            htmlFor="idNumber"
            required
            error={errors.idNumber}
          >
            <input
              id="idNumber"
              inputMode="numeric"
              className={inputClass}
              value={form.idNumber}
              aria-invalid={errors.idNumber ? true : undefined}
              onChange={(event) => update({ idNumber: event.target.value })}
            />
          </Field>
        </div>

        <div>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={form.needsInvoice}
              onChange={(event) => update({ needsInvoice: event.target.checked })}
              className="size-4 cursor-pointer accent-[#c2410c]"
            />
            <span className="font-display text-lg text-accent">Necesito una factura</span>
          </label>

          {/* Los campos fiscales solo aparecen al marcarlos: mostrarlos siempre
              cargaria el formulario para la mayoria, que compra a titulo personal. */}
          {form.needsInvoice ? (
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <Field
                label="Razon Social"
                htmlFor="businessName"
                required
                error={errors.businessName}
              >
                <input
                  id="businessName"
                  className={inputClass}
                  value={form.businessName}
                  aria-invalid={errors.businessName ? true : undefined}
                  onChange={(event) => update({ businessName: event.target.value })}
                />
              </Field>

              <Field label="Numero de RUC" htmlFor="ruc" required error={errors.ruc}>
                <input
                  id="ruc"
                  inputMode="numeric"
                  maxLength={11}
                  className={inputClass}
                  value={form.ruc}
                  aria-invalid={errors.ruc ? true : undefined}
                  onChange={(event) => update({ ruc: event.target.value })}
                />
              </Field>
            </div>
          ) : null}
        </div>

        <fieldset className="flex flex-col gap-6 border-t border-line pt-8">
          <legend className="label-caps text-ash">Direccion de envio</legend>
          <AddressFields
            idPrefix="shipping"
            address={form.shippingAddress}
            departments={departments}
            errors={errors.shippingAddress ?? {}}
            onChange={updateShippingAddress}
          />
        </fieldset>

        <button type="submit" className="sr-only">
          Continuar al metodo de entrega
        </button>
      </form>

      {quote ? (
        <OrderSummary items={quote.items} totals={quote.totals} shippingLabel="-">
          <div className="flex flex-col gap-4">
            {quote.issues.length > 0 ? <CartIssues issues={quote.issues} /> : null}
            <button
              type="button"
              onClick={handleSubmit}
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
