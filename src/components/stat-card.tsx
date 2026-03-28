import Link from "next/link";

type StatCardProps = {
  label: string;
  value: string;
  detail: string;
  href?: string;
};

export function StatCard({ label, value, detail, href }: StatCardProps) {
  const content = (
    <div className="rounded-[1.5rem] border border-white/10 bg-slate-900 p-5 text-white shadow-lg shadow-slate-950/20 transition hover:-translate-y-1 hover:border-orange-300/40 hover:shadow-2xl hover:shadow-slate-950/30">
      <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-4 text-4xl font-semibold">{value}</p>
      <p className="mt-3 text-sm text-slate-300">{detail}</p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
