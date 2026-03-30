import { AdminOverviewSearch } from "@/components/admin-overview-search";
import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { adminNavLinks } from "@/lib/admin-nav";
import { getDashboardData } from "@/lib/data";
import { getAllForms } from "@/lib/forms-store";

export default async function AdminDashboardPage() {
  const { data, activeMembers, activePlans } = await getDashboardData("admin");
  const forms = await getAllForms();

  return (
    <AppShell
      role="admin"
      title="Gym operations dashboard"
      subtitle="Manage workout programming, class schedules, and member records from the same workspace."
      navLinks={adminNavLinks}
    >
      <div className="grid gap-6 lg:grid-cols-4">
        <StatCard
          label="Members"
          value={String(data.profiles.filter((item) => item.role === "member").length)}
          detail="Member records available in the current tenant."
          href="/admin/attendance"
        />
        <StatCard
          label="Active memberships"
          value={String(activeMembers)}
          detail="Members with a current active package."
          href="/admin/memberships"
        />
        <StatCard
          label="Programs"
          value={String(data.workoutPlans.length)}
          detail="Workout templates ready for assignment."
          href="/admin/plans"
        />
        <StatCard
          label="Assignments"
          value={String(activePlans)}
          detail="Active plan-to-member links."
          href="/admin/schedule"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard eyebrow="Search" title="Global overview search">
          <AdminOverviewSearch data={data} forms={forms} pages={adminNavLinks} />
        </SectionCard>

        <div className="grid gap-6">
          <SectionCard eyebrow="Today" title="Operational focus">
            <div className="space-y-4 text-slate-700">
              <div className="rounded-[1.5rem] border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-orange-50/60 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
                <p className="font-semibold text-slate-950">Review expiring memberships</p>
                <p className="mt-2 text-sm text-slate-600">
                  Payment is intentionally deferred, so staff-only tracking needs to stay visible.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-sky-50/60 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
                <p className="font-semibold text-slate-950">Assign plans after assessment</p>
                <p className="mt-2 text-sm text-slate-600">
                  Program templates can be attached to members immediately after onboarding.
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard eyebrow="Roster" title="Member snapshot">
            <div className="space-y-3">
              {data.profiles
                .filter((profile) => profile.role === "member")
                .map((profile) => (
                  <div
                    key={profile.id}
                    className="flex flex-col gap-2 rounded-[1.5rem] border border-slate-200/80 bg-gradient-to-r from-white via-white to-slate-50/80 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.06)] transition-transform duration-200 hover:-translate-y-0.5 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-950">{profile.fullName}</p>
                      <p className="text-sm text-slate-600">{profile.fitnessGoal}</p>
                    </div>
                    <p className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-500">
                      {profile.branch}
                    </p>
                  </div>
                ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}
