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

function getMatchScore(pathname: string, href: string) {
  if (href === pathname) {
    return href.length + 1000;
  }

  if (href !== "/" && pathname.startsWith(`${href}/`)) {
    return href.length;
  }

  return -1;
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

  const categoryForPath = useMemo(() => {
    let bestCategory = groupedLinks[0]?.category ?? "Dashboard";
    let bestScore = -1;

    for (const group of groupedLinks) {
      for (const link of group.links) {
        const score = getMatchScore(pathname, link.href);

        if (score > bestScore) {
          bestScore = score;
          bestCategory = group.category;
        }
      }
    }

    return bestCategory;
  }, [groupedLinks, pathname]);
  const [selectedCategory, setSelectedCategory] = useState(categoryForPath);

  useEffect(() => {
    setSelectedCategory(categoryForPath);
  }, [categoryForPath]);

  if (!hasCategories) {
    return (
      <div className="flex flex-wrap gap-3 text-sm">
        {navLinks.map((link) => {
          const active = getMatchScore(pathname, link.href) >= 0;

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-full border px-4 py-2.5 font-medium transition ${
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
      <div className="flex flex-wrap gap-2.5">
        {groupedLinks.map((group) => {
          const activeCategory = selectedCategory === group.category;

          return (
            <button
              key={group.category}
              type="button"
              onClick={() => setSelectedCategory(group.category)}
              className={`rounded-full border px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.16em] transition ${
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

      <div className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-3 backdrop-blur">
        <div className="flex flex-wrap gap-2">
          {visibleGroup.links.map((link) => {
            const active = getMatchScore(pathname, link.href) >= 0;

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full border px-4 py-2.5 font-medium transition ${
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
