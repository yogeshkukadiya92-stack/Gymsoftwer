import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { getDashboardData } from "@/lib/data";

const navLinks = [
  { href: "/member", label: "Overview" },
  { href: "/member/workouts", label: "Workouts" },
  { href: "/member/progress", label: "Progress" },
  { href: "/member/schedule", label: "Schedule" },
  { href: "/member/profile", label: "Profile" },
];

export default async function MemberWorkoutsPage() {
  const { assignedPlan, data } = await getDashboardData("member");

  return (
    <AppShell
      role="member"
      title="Workout library"
      subtitle="Daily plan detail, exercise cues, and suggested progression all live here."
      navLinks={navLinks}
    >
      <div className="grid gap-6">
        <SectionCard eyebrow="Current plan" title={assignedPlan?.name ?? "No active plan"}>
          <div className="grid gap-4">
            {assignedPlan?.exercises.map((item) => {
              const exercise = data.exercises.find((entry) => entry.id === item.exerciseId);

              return (
                <div key={item.id} className="rounded-[1.5rem] border border-slate-200 p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
                        {exercise?.category}
                      </p>
                      <h2 className="mt-2 font-serif text-2xl text-slate-950">{exercise?.name}</h2>
                      <p className="mt-2 text-slate-600">
                        {item.sets} sets, {item.reps} reps, {item.restSeconds}s rest
                      </p>
                    </div>
                    <a
                      href={exercise?.mediaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Open {exercise?.mediaType}
                    </a>
                  </div>
                  <p className="mt-4 text-slate-700">{item.notes}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {exercise?.cues.map((cue) => (
                      <span
                        key={cue}
                        className="rounded-full bg-orange-50 px-3 py-1 text-sm text-orange-700"
                      >
                        {cue}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
