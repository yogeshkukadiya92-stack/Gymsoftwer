import { ReactNode } from "react";

type FilterToolbarProps = {
  children: ReactNode;
};

type FilterToolbarItemProps = {
  children: ReactNode;
  className?: string;
};

type FilterToolbarActionProps = {
  children: ReactNode;
  href: string;
};

export const panelClassName =
  "rounded-[2rem] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(248,250,252,0.94))] p-6 shadow-[0_24px_80px_rgba(7,24,39,0.08)]";

export const fieldClassName =
  "w-full rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.95))] px-4 py-3 text-sm text-slate-900 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition duration-200 placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100";

export const textareaClassName = `${fieldClassName} min-h-28 resize-y`;

export const secondaryButtonClassName =
  "inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:text-orange-700";

export const primaryButtonClassName =
  "inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-70";

export const accentButtonClassName =
  "inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_16px_30px_rgba(249,115,22,0.24)] transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-70";

export const dangerButtonClassName =
  "inline-flex items-center justify-center rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60";

export const tableShellClassName =
  "overflow-hidden rounded-[2rem] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.95))] shadow-[0_24px_80px_rgba(7,24,39,0.08)]";

export const tableClassName = "min-w-full border-collapse text-left text-sm";

export const tableHeaderCellClassName =
  "bg-slate-950/95 px-4 py-4 text-[0.76rem] font-semibold uppercase tracking-[0.18em] whitespace-nowrap text-slate-100";

export const tableRowClassName =
  "border-t border-slate-200 transition-colors odd:bg-white even:bg-slate-50/70 hover:bg-orange-50/40";

export const tableBodyCellClassName = "px-4 py-4 align-top text-slate-700";

export function FilterToolbar({ children }: FilterToolbarProps) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] p-4 shadow-[0_18px_50px_rgba(7,24,39,0.06)]">
      <div className="flex flex-wrap gap-3">{children}</div>
    </div>
  );
}

export function FilterToolbarItem({
  children,
  className = "min-w-[12rem] flex-1",
}: FilterToolbarItemProps) {
  return <div className={className}>{children}</div>;
}

export function FilterToolbarSearch(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} type="search" className={fieldClassName} />;
}

export function FilterToolbarSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={fieldClassName} />;
}

export function FilterToolbarAction({ children, href }: FilterToolbarActionProps) {
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center rounded-full border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-700 transition hover:border-orange-300 hover:bg-orange-100"
    >
      {children}
    </a>
  );
}
