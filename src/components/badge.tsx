type BadgeProps = {
  children: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "info";
};

const toneClasses: Record<NonNullable<BadgeProps["tone"]>, string> = {
  default: "border border-white/10 bg-white/8 text-white",
  success: "border border-emerald-400/20 bg-emerald-500/12 text-emerald-200",
  warning: "border border-amber-400/20 bg-amber-500/12 text-amber-100",
  danger: "border border-rose-400/20 bg-rose-500/12 text-rose-100",
  info: "border border-sky-400/20 bg-sky-500/12 text-sky-100",
};

export function Badge({ children, tone = "default" }: BadgeProps) {
  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.22em] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
