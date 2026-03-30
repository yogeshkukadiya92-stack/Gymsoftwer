"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = {
  href: string;
  label: string;
  category?: string;
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
  const hasCategories = navLinks.some((link) => link.category);

  if (!hasCategories) {
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

  const groupedLinks = navLinks.reduce(
    (groups, link) => {
      const category = link.category ?? "General";
      const existingGroup = groups.find((group) => group.category === category);

      if (existingGroup) {
        existingGroup.links.push(link);
        return groups;
      }

      groups.push({
        category,
        links: [link],
      });

      return groups;
    },
    [] as Array<{ category: string; links: NavLink[] }>,
  );

  return (
    <div className="grid gap-3 text-sm sm:grid-cols-2 2xl:grid-cols-3">
      {groupedLinks.map((group) => (
        <div
          key={group.category}
          className="rounded-[1.5rem] border border-white/10 bg-white/5 p-3 backdrop-blur"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            {group.category}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.links.map((link) => {
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
        </div>
      ))}
    </div>
  );
}
