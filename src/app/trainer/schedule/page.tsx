import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { getAppData } from "@/lib/data";

const trainerNavLinks = [
  { href: "/trainer", label: "Overview" },
  { href: "/trainer/clients", label: "Clients" },
  { href: "/trainer/schedule", label: "Schedule" },
];

export default async function TrainerSchedulePage() {
  const data = await getAppData();

  return (
    <AppShell
      role="trainer"
      title="Trainer class schedule"
      subtitle="Stay ready for your online classes and monitor whether Zoom links are in place."
      navLinks={trainerNavLinks}
    >
      <SectionCard eyebrow="Calendar" title="Upcoming classes">
        <div className="grid gap-4 lg:grid-cols-2">
          {data.sessions.map((session) => (
            <div key={session.id} className="rounded-[1.5rem] border border-slate-200 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
                {session.day}
              </p>
              <h2 className="mt-2 font-serif text-2xl text-slate-950">{session.title}</h2>
              <p className="mt-2 text-slate-700">
                {session.time} with {session.coach}
              </p>
              <p className="mt-3 text-sm text-slate-500">
                {session.room} • {session.zoomLink ? "Zoom link ready" : "Zoom link pending"}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
