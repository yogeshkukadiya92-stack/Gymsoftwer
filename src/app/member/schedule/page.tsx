import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { getDashboardData } from "@/lib/data";

const navLinks = [
  { href: "/member", label: "Overview" },
  { href: "/member/workouts", label: "Workouts" },
  { href: "/member/progress", label: "Progress" },
  { href: "/member/schedule", label: "Schedule" },
  { href: "/member/profile", label: "Profile" },
];

export default async function MemberSchedulePage() {
  const { data, viewer } = await getDashboardData("member");
  const memberAttendance = data.attendance.filter((entry) => entry.memberId === viewer.id);

  return (
    <AppShell
      role="member"
      title="Class and workshop schedule"
      subtitle="Members can review upcoming online sessions and keep their attendance status visible."
      navLinks={navLinks}
    >
      <SectionCard eyebrow="Workshops" title="Upcoming schedule">
        <div className="grid gap-4 lg:grid-cols-2">
          {data.sessions.map((session) => {
            const attendanceStatus =
              memberAttendance.find((entry) => entry.sessionId === session.id)?.status ??
              "Booked";

            const statusLabel =
              attendanceStatus === "Checked In"
                ? "Present"
                : attendanceStatus === "Missed"
                  ? "Absent"
                  : "Registered";

            return (
              <div key={session.id} className="rounded-[1.5rem] border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
                      {session.day}
                    </p>
                    <h2 className="mt-2 font-serif text-2xl text-slate-950">{session.title}</h2>
                  </div>
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700">
                    {statusLabel}
                  </span>
                </div>
                <p className="mt-2 text-slate-700">
                  {session.time} with {session.coach}
                </p>
                <p className="mt-3 text-sm text-slate-600">
                  Capacity {session.capacity} | {session.room}
                </p>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </AppShell>
  );
}
