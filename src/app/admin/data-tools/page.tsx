import { AppShell } from "@/components/app-shell";
import { DataToolsPanel } from "@/components/data-tools-panel";
import { SectionCard } from "@/components/section-card";
import { adminNavLinks } from "@/lib/admin-nav";

const sheetNames = [
  "profiles",
  "memberships",
  "exercises",
  "workout_plans",
  "workout_plan_exercises",
  "member_workout_assignments",
  "workout_logs",
  "classes_or_sessions",
  "attendance",
];

export default function AdminDataToolsPage() {
  return (
    <AppShell
      role="admin"
      title="Data tools"
      subtitle="Import and export gym data in Excel format so staff can work faster with bulk updates."
      navLinks={adminNavLinks}
    >
      <DataToolsPanel />

      <div className="mt-6">
        <SectionCard
          eyebrow="Workbook rules"
          title="Use the exported sheet structure for imports"
        >
          <div className="grid gap-3 text-slate-700 lg:grid-cols-2">
            {sheetNames.map((sheet) => (
              <div key={sheet} className="rounded-2xl bg-slate-50 px-4 py-3">
                {sheet}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
