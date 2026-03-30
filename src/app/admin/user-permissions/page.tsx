import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { UserPermissionsWorkspace } from "@/components/user-permissions-workspace";
import { adminNavLinks } from "@/lib/admin-nav";
import { getAppData } from "@/lib/data";

export default async function AdminUserPermissionsPage() {
  const data = await getAppData();

  return (
    <AppShell
      role="admin"
      title="User permissions"
      subtitle="Choose exactly which portal pages each member or trainer can open."
      navLinks={adminNavLinks}
    >
      <SectionCard eyebrow="Access control" title="Portal visibility">
        <UserPermissionsWorkspace
          users={data.profiles}
          initialPermissions={data.userPermissions}
        />
      </SectionCard>
    </AppShell>
  );
}
