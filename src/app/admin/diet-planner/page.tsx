import { AppShell } from "@/components/app-shell";
import { DietPlannerWorkspace } from "@/components/diet-planner-workspace";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { adminNavLinks } from "@/lib/admin-nav";
import { getAppData } from "@/lib/data";
import { getDietPlans } from "@/lib/business-data-store";

export default async function AdminDietPlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const params = await searchParams;
  const [starterDietPlans, data] = await Promise.all([getDietPlans(), getAppData()]);
  const members = data.profiles.filter((profile) => profile.role === "member");
  const avgAdherence =
    starterDietPlans.length > 0
      ? starterDietPlans.reduce((sum, plan) => sum + plan.adherence, 0) / starterDietPlans.length
      : 0;

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
          <DietPlannerWorkspace
            plans={starterDietPlans}
            members={members}
            prefillMemberId={params.userId ?? ""}
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}
