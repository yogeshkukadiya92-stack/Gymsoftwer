type PaymentStatusBadgeProps = {
  status: "Paid" | "Pending" | "Overdue" | "Partially Paid";
};

const statusClasses: Record<PaymentStatusBadgeProps["status"], string> = {
  Paid: "border-emerald-200/90 bg-emerald-50 text-emerald-700",
  Pending: "border-amber-200/90 bg-amber-50 text-amber-700",
  Overdue: "border-rose-200/90 bg-rose-50 text-rose-700",
  "Partially Paid": "border-sky-200/90 bg-sky-50 text-sky-700",
};

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] ${statusClasses[status]}`}
    >
      {status}
    </span>
  );
}
