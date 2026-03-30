"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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

  const categoryForPath = useMemo(
    () =>
      groupedLinks.find((group) =>
        group.links.some((link) => isActiveLink(pathname, link.href)),
      )?.category ?? "Dashboard",
    [groupedLinks, pathname],
  );
  const [selectedCategory, setSelectedCategory] = useState(categoryForPath);

  useEffect(() => {
    setSelectedCategory(categoryForPath);
  }, [categoryForPath]);

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

  const visibleGroup =
    groupedLinks.find((group) => group.category === selectedCategory) ?? groupedLinks[0];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {groupedLinks.map((group) => {
          const activeCategory = selectedCategory === group.category;

          return (
            <button
              key={group.category}
              type="button"
              onClick={() => setSelectedCategory(group.category)}
              className={`rounded-full border px-4 py-2 text-sm font-medium uppercase tracking-[0.18em] transition ${
                activeCategory
                  ? "border-orange-300 bg-orange-500/15 text-orange-100 shadow-[0_0_0_1px_rgba(253,186,116,0.2)]"
                  : "border-white/10 text-slate-200 hover:border-orange-300 hover:text-orange-100"
              }`}
            >
              {group.category}
            </button>
          );
        })}
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-3 backdrop-blur">
        <div className="flex flex-wrap gap-2">
          {visibleGroup.links.map((link) => {
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
    </div>
  );
}
