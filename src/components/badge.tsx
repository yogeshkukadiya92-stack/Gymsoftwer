type BadgeProps = {
  children: React.ReactNode;
  tone?: "default" | "success" | "warning";
};

const toneClasses: Record<NonNullable<BadgeProps["tone"]>, string> = {
  default: "bg-white/10 text-white",
  success: "bg-emerald-500/15 text-emerald-200",
  warning: "bg-amber-500/15 text-amber-100",
};

export function Badge({ children, tone = "default" }: BadgeProps) {
  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
