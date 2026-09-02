import Link from "next/link";

const STEPS = [
  { number: 1, label: "Detalles", href: "/checkout" },
  { number: 2, label: "Entrega", href: "/checkout/entrega" },
  { number: 3, label: "Pago", href: "/checkout/pago" },
] as const;

/**
 * Indicador de progreso del checkout.
 *
 * Los pasos ya superados son enlaces para poder volver a corregir un dato; los
 * siguientes son texto plano, porque saltarselos dejaria el pedido incompleto.
 */
export function CheckoutSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <nav aria-label="Progreso del pedido" className="border-b border-line pb-6">
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {STEPS.map((step, index) => {
          const done = step.number < current;
          const active = step.number === current;

          const content = (
            <span className="flex items-center gap-2.5">
              <span
                aria-hidden
                className={`grid size-7 place-items-center rounded-full text-xs font-bold tabular-nums ${
                  active
                    ? "bg-accent text-paper"
                    : done
                      ? "bg-ink text-paper"
                      : "border border-line text-ash"
                }`}
              >
                {step.number}
              </span>
              <span
                className={`label-caps ${active ? "text-ink" : done ? "text-steel" : "text-ash"}`}
              >
                {step.label}
              </span>
            </span>
          );

          return (
            <li key={step.number} className="flex items-center gap-3">
              {done ? (
                <Link href={step.href} className="transition-opacity hover:opacity-70">
                  {content}
                </Link>
              ) : (
                <span aria-current={active ? "step" : undefined}>{content}</span>
              )}
              {index < STEPS.length - 1 ? (
                <span aria-hidden className="h-px w-6 bg-line sm:w-10" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
