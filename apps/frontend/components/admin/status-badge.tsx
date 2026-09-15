const STYLES: Record<string, string> = {
  PENDING_PAYMENT: "border-accent text-accent",
  PAID: "border-ink text-ink bg-ink text-paper",
  SHIPPED: "border-ink text-ink",
  COMPLETED: "border-line text-muted",
  CANCELLED: "border-danger text-danger",
};

const LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Pendiente de pago",
  PAID: "Pagado",
  SHIPPED: "Enviado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`label-caps inline-flex items-center border px-2.5 py-1 ${STYLES[status] ?? "border-line text-muted"}`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
