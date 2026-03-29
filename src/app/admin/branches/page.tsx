import { AppShell } from "@/components/app-shell";
import { BranchManagementWorkspace } from "@/components/branch-management-workspace";
import { SectionCard } from "@/components/section-card";
import { adminNavLinks } from "@/lib/admin-nav";
import { getBranchOverview } from "@/lib/branch-utils";
import { getAppData } from "@/lib/data";

export default async function AdminBranchesPage() {
  const data = await getAppData();
  const branches = getBranchOverview(data);

  return (
    <AppShell
      role="admin"
      title="Branches"
      subtitle="Add and edit multiple gym branches, and manage branch-wise members and visit activity."
      navLinks={adminNavLinks}
    >
      <SectionCard eyebrow="Multi branch" title="Branch manager">
        <BranchManagementWorkspace initialBranches={branches} />
      </SectionCard>
    </AppShell>
  );
}
