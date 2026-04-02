import { AppShell } from "@/components/app-shell";
import { ClassAttendanceWorkspace } from "@/components/class-attendance-workspace";
import { SectionCard } from "@/components/section-card";
import { adminNavLinks } from "@/lib/admin-nav";
import { getAppData } from "@/lib/data";
import { getAllForms, getAllFormResponses } from "@/lib/forms-store";

export default async function AdminAttendancePage() {
  const data = await getAppData();
  const members = data.profiles.filter((profile) => profile.role === "member");
  const [forms, responses] = await Promise.all([getAllForms(), getAllFormResponses()]);

  return (
    <AppShell
      role="admin"
      title="Attendance"
      subtitle="Review attendance directly from submitted forms so you can see who joined each class without manual class creation."
      navLinks={adminNavLinks}
    >
      <ClassAttendanceWorkspace
        forms={forms}
        responses={responses}
        members={members}
      />

      <div className="mt-6">
        <SectionCard eyebrow="Note" title="How this page works">
          <p className="text-slate-700">
            Select an attendance form and a date. Everyone who submitted that form
            for the chosen day appears as part of the roster automatically, along
            with matched user details when the phone number belongs to a saved user.
          </p>
        </SectionCard>
      </div>
    </AppShell>
  );
}
