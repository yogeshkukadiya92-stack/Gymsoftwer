import Link from "next/link";

import { AppShellNav } from "@/components/app-shell-nav";
import { Badge } from "@/components/badge";
import { LogoutButton } from "@/components/logout-button";
import { appConfig, hasSupabaseEnv } from "@/lib/env";
import { UserRole } from "@/lib/types";

type NavLink = {
  href: string;
  label: string;
};

type AppShellProps = {
  role: UserRole;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  navLinks: NavLink[];
};

export function AppShell({
  role,
  title,
  subtitle,
  children,
  navLinks,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(240,127,45,0.18),_transparent_30%),linear-gradient(180deg,_#08131f_0%,_#102235_45%,_#f6efe4_45%,_#f6efe4_100%)]">
      <header className="border-b border-white/10 bg-slate-950/90 text-white backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="rounded-full border border-orange-400/40 bg-orange-500/10 px-3 py-1 text-sm font-semibold tracking-[0.2em] text-orange-200">
                {appConfig.name}
              </span>
              <Badge>{role} portal</Badge>
            </Link>
            <div>
              <h1 className="font-serif text-3xl">{title}</h1>
              <p className="max-w-2xl text-sm text-slate-300">{subtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-start gap-3 text-sm">
            <AppShellNav navLinks={navLinks} />
            <LogoutButton />
          </div>
        </div>
        {!hasSupabaseEnv ? (
          <div className="border-t border-orange-400/20 bg-orange-500/10 px-6 py-3 text-sm text-orange-100">
            Demo mode is active. Add Supabase environment variables to enable live
            authentication and database-backed data.
          </div>
        ) : null}
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}
