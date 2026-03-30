import { AppShell } from "@/components/app-shell";
import { AdminProgressWorkspace } from "@/components/admin-progress-workspace";
import { ProgressReportWorkspace } from "@/components/progress-report-workspace";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { adminNavLinks } from "@/lib/admin-nav";
import { getAppData } from "@/lib/data";

export default async function AdminProgressPage() {
  const data = await getAppData();
  const members = data.profiles.filter((profile) => profile.role === "member");
  const latestNotes = [...data.progressCheckIns]
    .sort((a, b) => b.recordedOn.localeCompare(a.recordedOn))
    .slice(0, 4);

  return (
    <AppShell
      role="admin"
      title="Client progress system"
      subtitle="Track weight, body measurements, progress photos, and trainer notes across your active client roster."
      navLinks={adminNavLinks}
    >
      <div className="grid gap-6 lg:grid-cols-4">
        <StatCard
          label="Check-ins"
          value={String(data.progressCheckIns.length)}
          detail="Recorded progress entries available in the current workspace."
        />
        <StatCard
          label="Photos"
          value={String(data.progressPhotos.length)}
          detail="Progress photos saved for visual comparison."
        />
        <StatCard
          label="Tracked members"
          value={String(
            members.filter((member) =>
              data.progressCheckIns.some((entry) => entry.memberId === member.id),
            ).length,
          )}
          detail="Members with at least one check-in on record."
        />
        <StatCard
          label="Coach notes"
          value={String(data.progressCheckIns.filter((item) => item.coachNote).length)}
          detail="Progress entries that include trainer observations."
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard eyebrow="Roster" title="Member progress snapshot">
          <ProgressReportWorkspace
            members={members}
            checkIns={data.progressCheckIns}
            photos={data.progressPhotos}
          />
        </SectionCard>

        <SectionCard eyebrow="Notes" title="Recent trainer notes">
          <div className="space-y-4">
            {latestNotes.map((entry) => {
              const member = data.profiles.find((profile) => profile.id === entry.memberId);

              return (
                <div key={entry.id} className="rounded-[1.5rem] bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">{member?.fullName}</p>
                    <p className="text-sm text-slate-500">{entry.recordedOn}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{entry.coachNote}</p>
                  <p className="mt-3 text-sm text-orange-700">
                    Energy: {entry.energyLevel} • Weight: {entry.weightKg} kg
                  </p>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard eyebrow="Manage" title="Add check-ins and upload photos">
          <AdminProgressWorkspace
            members={members}
            initialCheckIns={data.progressCheckIns}
            initialPhotos={data.progressPhotos}
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}
