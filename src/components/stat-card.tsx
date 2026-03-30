import Link from "next/link";

type StatCardProps = {
  label: string;
  value: string;
  detail: string;
  href?: string;
};

export function StatCard({ label, value, detail, href }: StatCardProps) {
  const content = (
    <div className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,18,30,0.98),rgba(13,26,42,0.94))] p-5 text-white shadow-[0_22px_60px_rgba(2,8,23,0.28)] transition duration-200 hover:-translate-y-1 hover:border-orange-300/40 hover:shadow-[0_28px_70px_rgba(2,8,23,0.34)]">
      <p className="text-[0.72rem] uppercase tracking-[0.28em] text-slate-400">{label}</p>
      <p className="mt-4 text-[2.35rem] font-semibold leading-none">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-300">{detail}</p>
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
