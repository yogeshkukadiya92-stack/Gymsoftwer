import Link from "next/link";

import { AppShellNav } from "@/components/app-shell-nav";
import { Badge } from "@/components/badge";
import { LogoutButton } from "@/components/logout-button";
import { getAuthenticatedProfile } from "@/lib/auth";
import { getAppData } from "@/lib/data";
import { appConfig, hasSupabaseEnv } from "@/lib/env";
import { UserRole } from "@/lib/types";
import { filterNavLinksByRoutes, getAllowedRoutesForProfile } from "@/lib/user-permissions";

type NavLink = {
  href: string;
  label: string;
  category?: string;
};

type AppShellProps = {
  role: UserRole;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  navLinks: NavLink[];
};

export async function AppShell({
  role,
  title,
  subtitle,
  children,
  navLinks,
}: AppShellProps) {
  let scopedNavLinks = navLinks;

  if (hasSupabaseEnv) {
    const [profile, data] = await Promise.all([getAuthenticatedProfile(), getAppData()]);

    if (profile && profile.role === role) {
      scopedNavLinks = filterNavLinksByRoutes(
        navLinks,
        getAllowedRoutesForProfile(profile, data.userPermissions),
      );
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(240,127,45,0.22),_transparent_24%),linear-gradient(180deg,_#07111c_0%,_#0d2032_38%,_#f6efe4_38%,_#f6efe4_100%)]">
      <header className="border-b border-white/10 bg-slate-950/85 text-white backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl gap-5 px-6 py-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_80px_rgba(2,6,23,0.28)]">
            <div className="space-y-4">
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="rounded-full border border-orange-400/40 bg-orange-500/10 px-3 py-1 text-sm font-semibold tracking-[0.2em] text-orange-200">
                  {appConfig.name}
                </span>
                <Badge>{role} portal</Badge>
              </Link>
              <div>
                <h1 className="font-serif text-3xl tracking-tight text-white sm:text-[2.35rem]">
                  {title}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-[0.95rem]">
                  {subtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/45 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.22)]">
            <div className="grid gap-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-slate-400">
                  Navigation
                </p>
                <LogoutButton />
              </div>
              <AppShellNav navLinks={scopedNavLinks} />
            </div>
          </div>
        </div>
        {!hasSupabaseEnv ? (
          <div className="border-t border-orange-400/20 bg-orange-500/10 px-6 py-3 text-sm text-orange-100">
            Demo mode is active. Add Supabase environment variables to enable live
            authentication and database-backed data.
          </div>
        ) : null}
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10 sm:py-12">{children}</main>
    </div>
  );
}
