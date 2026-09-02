import type { ReactNode } from "react";

/** Tarjeta de indicador del panel: cifra grande, etiqueta, detalle opcional. */
export function MetricCard({
  label,
  value,
  detail,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="border border-line bg-paper p-5">
      <p className="label-caps text-ash">{label}</p>
      <p className={`font-display mt-2 text-4xl tabular-nums ${accent ? "text-accent" : ""}`}>{value}</p>
      {detail ? <p className="mt-1 text-xs text-muted">{detail}</p> : null}
    </div>
  );
}
