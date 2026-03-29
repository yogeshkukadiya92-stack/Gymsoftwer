import { AppShell } from "@/components/app-shell";
import { ExerciseManagementWorkspace } from "@/components/exercise-management-workspace";
import { SectionCard } from "@/components/section-card";
import { adminNavLinks } from "@/lib/admin-nav";
import { getAppData } from "@/lib/data";

export default async function AdminExercisesPage() {
  const data = await getAppData();

  return (
    <AppShell
      role="admin"
      title="Exercise library"
      subtitle="Add and edit exercise names, cues, Google Drive links, and media details before using them inside workout plans."
      navLinks={adminNavLinks}
    >
      <SectionCard eyebrow="Content ops" title="Managed exercise catalog">
        <ExerciseManagementWorkspace initialExercises={data.exercises} />
      </SectionCard>
    </AppShell>
  );
}
