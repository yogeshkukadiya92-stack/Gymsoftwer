"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = {
  href: string;
  label: string;
};

type AppShellNavProps = {
  navLinks: NavLink[];
};

function isActiveLink(pathname: string, href: string) {
  if (href === pathname) {
    return true;
  }

  if (href !== "/" && pathname.startsWith(`${href}/`)) {
    return true;
  }

  return false;
}

export function AppShellNav({ navLinks }: AppShellNavProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-3 text-sm">
      {navLinks.map((link) => {
        const active = isActiveLink(pathname, link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full border px-4 py-2 transition ${
              active
                ? "border-orange-300 bg-orange-500/15 text-orange-100 shadow-[0_0_0_1px_rgba(253,186,116,0.2)]"
                : "border-white/10 text-slate-100 hover:border-orange-300 hover:text-orange-100"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
