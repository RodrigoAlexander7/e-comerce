import type { CartIssue } from "@/lib/api/types";

/**
 * Avisos de lo que cambio en el carrito desde que se anadio.
 *
 * Se listan todos juntos: descubrir de uno en uno que tres prendas se agotaron
 * obligaria al cliente a reintentar tres veces.
 */
export function CartIssues({ issues }: { issues: CartIssue[] }) {
  if (issues.length === 0) return null;

  return (
    <div role="alert" className="border-l-4 border-accent bg-mist p-5">
      <p className="label-caps text-accent">
        {issues.length === 1 ? "Un articulo cambio" : `${issues.length} articulos cambiaron`}
      </p>
      <ul className="mt-3 flex flex-col gap-1.5">
        {issues.map((issue) => (
          <li key={issue.variantId} className="text-sm leading-relaxed text-steel">
            {issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
