import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { getDashboardData } from "@/lib/data";
import {
  filterNavLinksByRoutes,
  getAllowedRoutesForProfile,
  getPortalFallbackRoute,
  routeIsAllowed,
  trainerPortalRoutes,
} from "@/lib/user-permissions";

export default async function TrainerDashboardPage() {
  const { data, viewer } = await getDashboardData("trainer");
  const allowedRoutes = getAllowedRoutesForProfile(viewer, data.userPermissions);
  if (!routeIsAllowed("/trainer", allowedRoutes)) {
    redirect(getPortalFallbackRoute(viewer, data));
  }
  const trainerNavLinks = filterNavLinksByRoutes(trainerPortalRoutes, allowedRoutes);
  const trainer = viewer;
  const activePlans = data.workoutPlans.filter(
    (plan) => plan.coach === trainer?.fullName,
  );
  const coachedSessions = data.sessions.filter((session) => session.coach === trainer?.fullName);
  const assignedMembers = data.assignments
    .map((assignment) => data.profiles.find((profile) => profile.id === assignment.memberId))
    .filter((profile): profile is NonNullable<typeof profile> => Boolean(profile));

  return (
    <AppShell
      role="trainer"
      title="Trainer control panel"
      subtitle="See your active clients, online classes, and programming workload from one trainer workspace."
      navLinks={trainerNavLinks}
    >
      <div className="grid gap-6 lg:grid-cols-4">
        <StatCard
          label="Assigned clients"
          value={String(assignedMembers.length)}
          detail="Members currently attached to your active training plans."
        />
        <StatCard
          label="Programs"
          value={String(activePlans.length)}
          detail="Workout plans currently coached by you."
        />
        <StatCard
          label="Classes"
          value={String(coachedSessions.length)}
          detail="Online sessions currently assigned to your calendar."
        />
        <StatCard
          label="Check-ins"
          value={String(data.progressCheckIns.length)}
          detail="Total progress entries available for review."
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard eyebrow="Clients" title="Assigned roster">
          <div className="space-y-3">
            {assignedMembers.map((member) => (
              <div
                key={member.id}
                className="rounded-[1.5rem] border border-slate-200 p-4"
              >
                <p className="font-semibold text-slate-950">{member.fullName}</p>
                <p className="mt-1 text-sm text-slate-600">{member.fitnessGoal}</p>
                <p className="mt-2 text-sm text-slate-500">{member.email}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard eyebrow="Focus" title="Coach actions">
          <div className="space-y-4 text-sm text-slate-600">
            <div className="rounded-[1.5rem] bg-slate-50 p-4">
              <p className="font-semibold text-slate-950">Review Zoom class flow</p>
              <p className="mt-2">Check session joins, present clients, and follow-up reminders.</p>
            </div>
            <div className="rounded-[1.5rem] bg-slate-50 p-4">
              <p className="font-semibold text-slate-950">Update diet and progress</p>
              <p className="mt-2">Use admin progress and diet planner to keep client plans current.</p>
            </div>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
