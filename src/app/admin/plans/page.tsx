import { AppShell } from "@/components/app-shell";
import { PlansReportWorkspace } from "@/components/plans-report-workspace";
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
      <SectionCard eyebrow="Programs" title="Plans workspace">
        <PlansReportWorkspace
          plans={data.workoutPlans}
          assignments={data.assignments}
          profiles={data.profiles}
        />
      </SectionCard>
    </AppShell>
  );
}
