import Link from "next/link";

import { Badge } from "@/components/badge";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { appConfig } from "@/lib/env";

const launchStats = [
  {
    label: "Operations",
    value: "Unified",
    detail: "Memberships, plans, attendance, and schedules in one surface.",
  },
  {
    label: "Coaching",
    value: "Role-based",
    detail: "Members, trainers, and admins get tailored workflows from day one.",
  },
  {
    label: "Delivery",
    value: "MVP-ready",
    detail: "Designed for Next.js, Supabase, and Vercel deployment from the start.",
  },
];

const featureColumns = [
  {
    eyebrow: "Members",
    title: "Train with clarity, not WhatsApp chaos.",
    items: [
      "Assigned workouts with clear exercise cues and progression notes",
      "Training logs for sets, reps, weight, and daily comments",
      "Upcoming class schedule, attendance, and membership status at a glance",
    ],
  },
  {
    eyebrow: "Staff",
    title: "Operate the gym from one command center.",
    items: [
      "Exercise library with admin-managed media, coaching cues, and difficulty",
      "Workout plan builder with reusable exercise templates",
      "Membership, schedule, and member oversight without adding payment complexity yet",
    ],
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(240,127,45,0.2),_transparent_30%),linear-gradient(180deg,_#08131f_0%,_#102235_50%,_#f6efe4_50%,_#f6efe4_100%)] text-slate-950">
      <header className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 text-white lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-orange-300/35 bg-orange-400/10 px-4 py-2 text-sm font-semibold tracking-[0.22em] text-orange-100">
            {appConfig.name}
          </span>
          <Badge>Public MVP</Badge>
        </div>
        <nav className="flex flex-wrap gap-3 text-sm">
          <Link href="/sign-in" className="rounded-full border border-white/15 px-4 py-2">
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-full bg-orange-500 px-4 py-2 font-semibold text-slate-950"
          >
            Start now
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 pb-18 pt-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-8 text-white">
          <Badge>All-in-one gym web app</Badge>
          <div className="space-y-5">
            <h1 className="max-w-4xl font-serif text-5xl leading-tight sm:text-6xl">
              Run the gym floor, coach members, and launch online from one app.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-200">
              {appConfig.description} This MVP gives members a clear training
              experience while staff manage plans, schedules, attendance, and
              memberships without juggling disconnected tools.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/member"
              className="rounded-full bg-orange-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-orange-400"
            >
              Explore member app
            </Link>
            <Link
              href="/admin"
              className="rounded-full border border-white/15 px-6 py-3 font-semibold text-white transition hover:border-orange-300"
            >
              Explore operations
            </Link>
          </div>
        </div>
        <div className="grid gap-4">
          {launchStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-18 lg:grid-cols-2">
        {featureColumns.map((column) => (
          <SectionCard key={column.title} eyebrow={column.eyebrow} title={column.title}>
            <ul className="space-y-3 text-slate-700">
              {column.items.map((item) => (
                <li key={item} className="rounded-2xl bg-slate-50 px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </SectionCard>
        ))}
      </section>
    </div>
  );
}
