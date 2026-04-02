import { AppShell } from "@/components/app-shell";
import { ClassAttendanceWorkspace } from "@/components/class-attendance-workspace";
import { SectionCard } from "@/components/section-card";
import { adminNavLinks } from "@/lib/admin-nav";
import { getAppData } from "@/lib/data";

export default async function AdminAttendancePage() {
  const data = await getAppData();
  const members = data.profiles.filter((profile) => profile.role === "member");

  return (
    <AppShell
      role="admin"
      title="Attendance"
      subtitle="Review attendance records from your class flow, apply filters, and manage present, registered, or absent status."
      navLinks={adminNavLinks}
    >
      <ClassAttendanceWorkspace
        sessions={data.sessions}
        attendance={data.attendance}
        members={members}
      />

      <div className="mt-6">
        <SectionCard eyebrow="Note" title="How this page works">
          <p className="text-slate-700">
            This page is built for quick attendance handling. Select an existing
            class, review the incoming attendance list, and mark each client as
            registered, present, or absent.
          </p>
        </SectionCard>
      </div>
    </AppShell>
  );
}
