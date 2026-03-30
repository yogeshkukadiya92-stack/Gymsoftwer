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

const inputBaseClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-300";

export function FilterToolbar({ children }: FilterToolbarProps) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] p-4 shadow-[0_18px_50px_rgba(7,24,39,0.06)]">
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
  return <input {...props} type="search" className={inputBaseClassName} />;
}

export function FilterToolbarSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={inputBaseClassName} />;
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
