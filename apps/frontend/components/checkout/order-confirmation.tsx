import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";
import { ClockIcon } from "@/components/icons";
import type { Order, PaymentInstructions } from "@/lib/api/types";

/**
 * Paso 4: confirmacion y instrucciones de pago.
 *
 * Es la pantalla mas importante del flujo offline: si el cliente la cierra sin
 * leerla, no sabra a donde pagar. Por eso las instrucciones van arriba, antes
 * que el resumen del pedido, y se repiten en el correo.
 */
export function OrderConfirmation({
  order,
  payment,
}: {
  order: Order;
  payment: PaymentInstructions;
}) {
  const isYape = order.paymentMethod === "YAPE_PLIN";
  const deadline = new Intl.DateTimeFormat("es-PE", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(new Date(order.paymentDueAt));

  return (
    <div className="shell py-12 md:py-16">
      <div className="grid gap-12 lg:grid-cols-[1fr_22rem] lg:gap-16">
        <div className="flex flex-col gap-8">
          <header className="flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-6">
            <div>
              <h1 className="font-display text-4xl md:text-5xl">Gracias por tu orden</h1>
              <p className="mt-3 text-lg">
                Orden <strong className="font-semibold">{order.number}</strong>
              </p>
            </div>
          </header>

          {/* Bloque de retencion: convertir al invitado en cuenta registrada. */}
          <div className="flex flex-wrap items-center gap-4 border border-line bg-canvas p-6">
            <ButtonLink href="/cuenta" variant="solid" size="sm">
              Registrarse
            </ButtonLink>
            <p className="text-sm text-steel">
              Crea tu cuenta para dar seguimiento a esta orden y a las siguientes.
            </p>
          </div>

          <section className="border-2 border-accent p-6 md:p-8">
            <p className="label-caps flex items-center gap-2 text-accent">
              <ClockIcon className="size-4" />
              Pago pendiente &middot; {payment.paymentWindowHours} horas
            </p>

            {isYape ? (
              <>
                <h2 className="font-display mt-4 text-2xl leading-snug md:text-3xl">
                  Realiza tu pago con Yape o Plin al numero {payment.yapePhone}
                </h2>
                <p className="mt-3 text-base leading-relaxed text-steel">
                  O escanea el codigo QR a continuacion. La cuenta esta a nombre de{" "}
                  {payment.companyName}.
                </p>

                <div className="mt-6 inline-block border-2 border-ink bg-paper p-3">
                  <Image
                    src={payment.yapeQrUrl}
                    alt={`Codigo QR de Yape de ${payment.companyName}`}
                    width={200}
                    height={200}
                    className="size-50"
                  />
                </div>
              </>
            ) : (
              <>
                <h2 className="font-display mt-4 text-2xl leading-snug md:text-3xl">
                  Transfiere el total a una de nuestras cuentas
                </h2>
                <p className="mt-3 text-base leading-relaxed text-steel">
                  A nombre de {payment.companyName}, RUC {payment.companyRuc}.
                </p>
              </>
            )}

            {payment.bankAccounts.length > 0 ? (
              <dl className="mt-6 flex flex-col gap-4 border-t border-line pt-6">
                {payment.bankAccounts.map((account) => (
                  <div key={account.accountNumber}>
                    <dt className="label-caps text-ash">Cuenta soles {account.bank}</dt>
                    <dd className="mt-1 font-mono text-sm tabular-nums">
                      {account.accountNumber}
                      <span className="block text-muted">CCI: {account.cci}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <div className="mt-6 border-t border-line pt-6">
              <p className="text-base leading-relaxed">
                Luego envia tu comprobante por{" "}
                <a
                  href={payment.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-accent underline"
                >
                  WhatsApp al {payment.yapePhone}
                </a>{" "}
                o al correo{" "}
                <a
                  href={`mailto:${payment.companyEmail}`}
                  className="font-semibold text-accent underline"
                >
                  {payment.companyEmail}
                </a>
                .
              </p>
              <p className="mt-4 text-sm text-muted">
                Comunicacion: <strong className="text-ink">{order.number}</strong> &middot; plazo
                hasta el {deadline}.
              </p>
            </div>
          </section>

          <section className="border border-line p-6">
            <span className="label-caps rounded-full border border-line px-3 py-1 text-steel">
              Entrega y facturacion
            </span>

            <p className="mt-5 font-semibold">{order.customer.name}</p>
            <address className="mt-2 text-sm not-italic leading-relaxed text-steel">
              {[
                order.shippingAddress.street,
                order.shippingAddress.apartment,
                order.shippingAddress.district,
                order.shippingAddress.city,
                order.shippingAddress.state,
                order.shippingAddress.country,
              ]
                .filter((part): part is string => part !== null && part.trim() !== "")
                .map((part) => (
                  <span key={part} className="block">
                    {part}
                  </span>
                ))}
            </address>
            <p className="mt-4 text-sm text-muted">{order.shippingMethodName}</p>

            {order.invoice ? (
              <div className="mt-6 border-t border-line pt-5">
                <p className="label-caps">Datos para la factura</p>
                <p className="mt-2 text-sm leading-relaxed text-steel">
                  Razon Social: {order.invoice.businessName}
                  <br />
                  Numero de RUC: {order.invoice.ruc}
                </p>
              </div>
            ) : null}
          </section>

          <p className="text-sm text-muted">
            Enviamos una copia de estas instrucciones a {order.customer.email}.{" "}
            <Link href="/tienda" className="underline hover:text-ink">
              Seguir comprando
            </Link>
          </p>
        </div>

        <aside className="border border-line bg-paper p-6 lg:sticky lg:top-28 lg:self-start">
          <h2 className="sr-only">Resumen del pedido</h2>
          <ul className="flex flex-col gap-5">
            {order.items.map((item) => (
              <li key={item.sku} className="flex items-start gap-4">
                <div className="relative size-16 shrink-0 overflow-hidden bg-mist">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt="" fill sizes="64px" className="object-cover" />
                  ) : null}
                  <span
                    aria-hidden
                    className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-accent text-[10px] font-bold text-paper tabular-nums"
                  >
                    {item.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug">{item.productName}</p>
                  <p className="mt-0.5 text-xs text-muted">{item.variantLabel}</p>
                </div>
                <p className="shrink-0 text-sm font-medium tabular-nums">
                  {formatPrice(item.lineTotalCents)}
                </p>
              </li>
            ))}
          </ul>

          <dl className="mt-6 flex flex-col gap-2 border-t border-line pt-6 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Entrega</dt>
              <dd className="tabular-nums">{formatPrice(order.totals.shippingCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(order.totals.subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Impuestos</dt>
              <dd className="tabular-nums">{formatPrice(order.totals.taxCents)}</dd>
            </div>
            <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
              <dt className="font-display text-xl">Total</dt>
              <dd className="text-lg font-bold tabular-nums">
                {formatPrice(order.totals.totalCents)}
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
