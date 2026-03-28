import Link from "next/link";

type AuthCardProps = {
  title: string;
  description: string;
  footerLabel: string;
  footerHref: string;
  footerText: string;
};

export function AuthCard({
  title,
  description,
  footerLabel,
  footerHref,
  footerText,
}: AuthCardProps) {
  return (
    <div className="mx-auto w-full max-w-xl rounded-[2rem] border border-white/10 bg-slate-950/95 p-8 text-white shadow-[0_30px_120px_rgba(7,24,39,0.45)]">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-200">
        GymFlow access
      </p>
      <h1 className="mt-4 font-serif text-4xl">{title}</h1>
      <p className="mt-4 text-slate-300">{description}</p>
      <form className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm text-slate-200">Email</span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500"
            placeholder="coach@gymflow.app"
            type="email"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-slate-200">Password</span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500"
            placeholder="••••••••"
            type="password"
          />
        </label>
        <button
          className="w-full rounded-full bg-orange-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-orange-400"
          type="button"
        >
          Continue in demo mode
        </button>
      </form>
      <div className="mt-8 grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
        <p className="font-semibold text-white">Quick access routes</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/member" className="rounded-full border border-white/10 px-4 py-2">
            Member dashboard
          </Link>
          <Link href="/admin" className="rounded-full border border-white/10 px-4 py-2">
            Admin dashboard
          </Link>
        </div>
      </div>
      <p className="mt-6 text-sm text-slate-400">
        {footerText}{" "}
        <Link href={footerHref} className="font-semibold text-orange-200">
          {footerLabel}
        </Link>
      </p>
    </div>
  );
}
