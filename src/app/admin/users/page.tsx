import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { UserManagementWorkspace } from "@/components/user-management-workspace";
import { adminNavLinks } from "@/lib/admin-nav";
import { getManagedUserLoginStatuses } from "@/lib/auth";
import { getAppData } from "@/lib/data";

export default async function AdminUsersPage() {
  const data = await getAppData();
  const loginStatuses = await getManagedUserLoginStatuses(data.profiles);

  return (
    <AppShell
      role="admin"
      title="User management"
      subtitle="Create and manage admin, trainer, and member accounts from one secure workspace."
      navLinks={adminNavLinks}
    >
      <SectionCard eyebrow="Accounts" title="Roles and access">
        <UserManagementWorkspace
          initialUsers={data.profiles}
          initialLoginStatuses={loginStatuses}
          initialUserPermissions={data.userPermissions}
          gymBranches={data.gymBranches}
          branchVisits={data.branchVisits}
          sessions={data.sessions}
          memberships={data.memberships}
        />
      </SectionCard>
    </AppShell>
  );
}
