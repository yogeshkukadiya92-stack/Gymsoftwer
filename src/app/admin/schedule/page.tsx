import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { SessionZoomManager } from "@/components/session-zoom-manager";
import { WorkshopAttendanceManager } from "@/components/workshop-attendance-manager";
import { adminNavLinks } from "@/lib/admin-nav";
import { getAppData } from "@/lib/data";

export default async function AdminSchedulePage() {
  const data = await getAppData();
  const members = data.profiles.filter((profile) => profile.role === "member");
  const weeklySessions = data.sessions.length;
  const totalPresent = data.attendance.filter(
    (entry) => entry.status === "Checked In",
  ).length;
  const totalMissed = data.attendance.filter(
    (entry) => entry.status === "Missed",
  ).length;

  return (
    <AppShell
      role="admin"
      title="Schedule and attendance"
      subtitle="Lead weekly online workshops, track client attendance, and keep every session roster ready."
      navLinks={adminNavLinks}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard eyebrow="Weekly load" title="Workshop cadence">
          <div className="grid gap-4 text-slate-700">
            <div className="rounded-[1.5rem] bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Sessions this week</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{weeklySessions}</p>
            </div>
            <div className="rounded-[1.5rem] bg-emerald-50 p-4">
              <p className="text-sm text-emerald-700">Clients marked present</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-900">{totalPresent}</p>
            </div>
            <div className="rounded-[1.5rem] bg-rose-50 p-4">
              <p className="text-sm text-rose-700">Clients missed</p>
              <p className="mt-2 text-3xl font-semibold text-rose-900">{totalMissed}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard eyebrow="Roster" title="Active workshop clients" className="lg:col-span-2">
          <div className="grid gap-3 md:grid-cols-3">
            {members.map((member) => (
              <div key={member.id} className="rounded-[1.5rem] border border-slate-200 p-4">
                <p className="font-semibold text-slate-950">{member.fullName}</p>
                <p className="mt-1 text-sm text-slate-600">{member.fitnessGoal}</p>
                <p className="mt-3 text-sm text-slate-500">{member.email}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-6">
        <SessionZoomManager sessions={data.sessions} />
      </div>

      <div className="mt-6">
        <WorkshopAttendanceManager
          sessions={data.sessions}
          attendance={data.attendance}
          members={members}
        />
      </div>

      <div className="mt-6">
        <SectionCard eyebrow="Session view" title="Weekly workshop schedule">
          <div className="grid gap-4 lg:grid-cols-2">
            {data.sessions.map((session) => {
              const activeCount = data.attendance.filter(
                (entry) => entry.sessionId === session.id && entry.status !== "Missed",
              ).length;

              return (
                <div key={session.id} className="rounded-[1.5rem] border border-slate-200 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
                    {session.day}
                  </p>
                  <h2 className="mt-2 font-serif text-2xl text-slate-950">{session.title}</h2>
                  <p className="mt-2 text-slate-700">
                    {session.time} with {session.coach}
                  </p>
                  <p className="mt-3 text-sm text-slate-500">
                    {activeCount}/{session.capacity} registered | {session.room}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {session.zoomLink ? "Zoom link ready for members" : "Zoom link not added yet"}
                  </p>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
