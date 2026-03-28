import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { getDashboardData } from "@/lib/data";

const navLinks = [
  { href: "/member", label: "Overview" },
  { href: "/member/workouts", label: "Workouts" },
  { href: "/member/progress", label: "Progress" },
  { href: "/member/schedule", label: "Schedule" },
  { href: "/member/profile", label: "Profile" },
];

export default async function MemberDashboardPage() {
  const { viewer, assignedPlan, membershipStatus, completedSessions, bookedClasses } =
    await getDashboardData("member");

  return (
    <AppShell
      role="member"
      title={`Welcome back, ${viewer.fullName.split(" ")[0]}`}
      subtitle="Track training, stay on schedule, and keep your gym membership details close at hand."
      navLinks={navLinks}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <StatCard
          label="Active plan"
          value={assignedPlan?.name ?? "No plan"}
          detail={assignedPlan?.goal ?? "Assign a workout plan to get started."}
        />
        <StatCard
          label="Completed logs"
          value={String(completedSessions)}
          detail="Training sessions recorded in the current account view."
        />
        <StatCard
          label="Membership"
          value={membershipStatus ?? "Unavailable"}
          detail="Membership status is visible here without requiring payment integration."
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard eyebrow="Assigned workout" title={assignedPlan?.name ?? "No active assignment"}>
          <div className="space-y-4 text-slate-700">
            <p>{assignedPlan?.goal ?? "An admin or trainer can assign a program from the operations dashboard."}</p>
            <div className="grid gap-3">
              {assignedPlan?.exercises.map((item) => (
                <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{item.reps} reps x {item.sets} sets</p>
                  <p className="mt-2 text-sm text-slate-600">{item.notes}</p>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard eyebrow="Weekly cadence" title="Schedule snapshot">
          <div className="space-y-4 text-slate-700">
            <p>{bookedClasses} class booking(s) currently linked to this member profile.</p>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-950">Mobility + strength mix</p>
              <p className="mt-2 text-sm text-slate-600">
                Keep one recovery-focused class alongside the main strength plan for better adherence.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
