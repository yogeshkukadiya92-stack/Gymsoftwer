import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { adminNavLinks } from "@/lib/admin-nav";
import { getAppData } from "@/lib/data";

export default async function AdminPlansPage() {
  const data = await getAppData();

  return (
    <AppShell
      role="admin"
      title="Workout plans and assignments"
      subtitle="Program templates can be built once, reused often, and assigned to members with clear ownership."
      navLinks={adminNavLinks}
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SectionCard eyebrow="Templates" title="Workout plans">
          <div className="space-y-4">
            {data.workoutPlans.map((plan) => (
              <div key={plan.id} className="rounded-[1.5rem] bg-slate-50 p-5">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">{plan.name}</p>
                    <p className="text-sm text-slate-600">{plan.goal}</p>
                  </div>
                  <p className="text-sm text-slate-500">
                    {plan.split} • {plan.durationWeeks} weeks
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard eyebrow="Assignments" title="Current member mappings">
          <div className="space-y-4">
            {data.assignments.map((assignment) => {
              const plan = data.workoutPlans.find((entry) => entry.id === assignment.planId);
              const member = data.profiles.find((entry) => entry.id === assignment.memberId);

              return (
                <div key={assignment.id} className="rounded-[1.5rem] border border-slate-200 p-5">
                  <p className="font-semibold text-slate-950">{member?.fullName}</p>
                  <p className="mt-2 text-slate-600">{plan?.name}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Started {assignment.startDate} • {assignment.status}
                  </p>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
