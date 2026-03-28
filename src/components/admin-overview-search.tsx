"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { IntakeForm } from "@/lib/forms";
import { AppData } from "@/lib/types";

type SearchItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  type:
    | "member"
    | "trainer"
    | "admin"
    | "membership"
    | "program"
    | "exercise"
    | "session"
    | "inventory"
    | "form"
    | "page";
  keywords: string;
};

type AdminOverviewSearchProps = {
  data: AppData;
  forms: IntakeForm[];
  pages: Array<{ href: string; label: string }>;
};

function buildSearchItems(
  data: AppData,
  forms: IntakeForm[],
  pages: Array<{ href: string; label: string }>,
) {
  const profileItems: SearchItem[] = data.profiles.map((profile) => ({
    id: `profile-${profile.id}`,
    title: profile.fullName,
    subtitle: `${profile.role} • ${profile.branch || "No branch"} • ${profile.email}`,
    href: "/admin/users",
    type: profile.role,
    keywords: [
      profile.fullName,
      profile.email,
      profile.phone,
      profile.branch,
      profile.fitnessGoal,
      profile.role,
    ]
      .join(" ")
      .toLowerCase(),
  }));

  const membershipItems: SearchItem[] = data.memberships.map((membership) => {
    const member = data.profiles.find((profile) => profile.id === membership.memberId);

    return {
      id: `membership-${membership.id}`,
      title: member?.fullName || membership.planName,
      subtitle: `${membership.planName} • ${membership.status} • ${membership.paymentStatus}`,
      href: "/admin/memberships",
      type: "membership",
      keywords: [
        member?.fullName,
        membership.planName,
        membership.status,
        membership.paymentStatus,
        membership.billingCycle,
      ]
        .join(" ")
        .toLowerCase(),
    };
  });

  const workoutItems: SearchItem[] = data.workoutPlans.map((plan) => ({
    id: `plan-${plan.id}`,
    title: plan.name,
    subtitle: `${plan.goal} • ${plan.coach} • ${plan.split}`,
    href: "/admin/plans",
    type: "program",
    keywords: [plan.name, plan.goal, plan.coach, plan.split].join(" ").toLowerCase(),
  }));

  const exerciseItems: SearchItem[] = data.exercises.map((exercise) => ({
    id: `exercise-${exercise.id}`,
    title: exercise.name,
    subtitle: `${exercise.category} • ${exercise.primaryMuscle} • ${exercise.equipment}`,
    href: "/admin/exercises",
    type: "exercise",
    keywords: [
      exercise.name,
      exercise.category,
      exercise.primaryMuscle,
      exercise.equipment,
      exercise.difficulty,
    ]
      .join(" ")
      .toLowerCase(),
  }));

  const sessionItems: SearchItem[] = data.sessions.map((session) => ({
    id: `session-${session.id}`,
    title: session.title,
    subtitle: `${session.day} • ${session.time} • ${session.coach}`,
    href: "/admin/attendance",
    type: "session",
    keywords: [session.title, session.day, session.time, session.coach, session.room]
      .join(" ")
      .toLowerCase(),
  }));

  const inventoryItems: SearchItem[] = data.inventoryItems.map((item) => ({
    id: `inventory-${item.id}`,
    title: item.name,
    subtitle: `${item.brand} • ${item.category} • Stock ${item.stockUnits}`,
    href: "/admin/inventory",
    type: "inventory",
    keywords: [
      item.name,
      item.brand,
      item.category,
      item.supplementType,
      item.flavor,
      item.supplierName,
      item.sku,
    ]
      .join(" ")
      .toLowerCase(),
  }));

  const formItems: SearchItem[] = forms.map((form) => ({
    id: `form-${form.id}`,
    title: form.title,
    subtitle: `${form.audience} • ${form.status} • ${form.slug}`,
    href: "/admin/form-responses",
    type: "form",
    keywords: [form.title, form.description, form.audience, form.slug, form.status]
      .join(" ")
      .toLowerCase(),
  }));

  const pageItems: SearchItem[] = pages.map((page) => ({
    id: `page-${page.href}`,
    title: page.label,
    subtitle: `Open ${page.label} page`,
    href: page.href,
    type: "page",
    keywords: [page.label, page.href].join(" ").toLowerCase(),
  }));

  return [
    ...pageItems,
    ...profileItems,
    ...membershipItems,
    ...workoutItems,
    ...exerciseItems,
    ...sessionItems,
    ...inventoryItems,
    ...formItems,
  ];
}

export function AdminOverviewSearch({
  data,
  forms,
  pages,
}: AdminOverviewSearchProps) {
  const [query, setQuery] = useState("");

  const items = useMemo(() => buildSearchItems(data, forms, pages), [data, forms, pages]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return items.slice(0, 8);
    }

    return items
      .filter(
        (item) =>
          item.title.toLowerCase().includes(normalized) ||
          item.subtitle.toLowerCase().includes(normalized) ||
          item.keywords.includes(normalized),
      )
      .slice(0, 16);
  }, [items, query]);

  return (
    <div className="space-y-4">
      <div className="rounded-[1.5rem] bg-slate-50 p-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Search across overview
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search members, plans, attendance, supplements, forms, pages..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-orange-300"
          />
        </label>
        <p className="mt-2 text-xs text-slate-500">
          Search works across users, memberships, workout plans, exercise library, attendance,
          inventory, forms, and admin pages.
        </p>
      </div>

      <div className="grid gap-3">
        {results.length > 0 ? (
          results.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="rounded-[1.25rem] border border-slate-200 bg-white p-4 transition hover:border-orange-300 hover:bg-orange-50/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.subtitle}</p>
                </div>
                <span className="rounded-full bg-slate-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                  {item.type}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            No results found for this search.
          </div>
        )}
      </div>
    </div>
  );
}
