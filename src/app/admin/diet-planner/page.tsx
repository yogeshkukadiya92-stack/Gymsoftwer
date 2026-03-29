import { AppShell } from "@/components/app-shell";
import { DietPlannerWorkspace } from "@/components/diet-planner-workspace";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { adminNavLinks } from "@/lib/admin-nav";
import { starterDietPlans } from "@/lib/business-data";

export default function AdminDietPlannerPage() {
  const avgAdherence =
    starterDietPlans.reduce((sum, plan) => sum + plan.adherence, 0) / starterDietPlans.length;

  return (
    <AppShell
      role="admin"
      title="Diet planner"
      subtitle="Create practical meal frameworks, review adherence, and coach members with simple nutrition plans."
      navLinks={adminNavLinks}
    >
      <div className="grid gap-6 lg:grid-cols-4">
        <StatCard label="Diet plans" value={String(starterDietPlans.length)} detail="Active member nutrition plans currently in rotation." />
        <StatCard label="Avg adherence" value={`${Math.round(avgAdherence)}%`} detail="Average plan follow-through reported by members." />
        <StatCard label="High protein" value={String(starterDietPlans.filter((plan) => plan.proteinGrams >= 140).length)} detail="Plans targeting strong protein intake." />
        <StatCard label="Coach reviewed" value={String(starterDietPlans.length)} detail="Plans reviewed and updated by coaching staff." />
      </div>

      <div className="mt-6">
        <SectionCard eyebrow="Meals" title="Member diet plans">
          <DietPlannerWorkspace plans={starterDietPlans} />
        </SectionCard>
      </div>
    </AppShell>
  );
}
