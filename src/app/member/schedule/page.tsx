import { AppShell } from "@/components/app-shell";
import { MemberSessionList } from "@/components/member-session-list";
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
        <MemberSessionList
          sessions={data.sessions}
          attendance={memberAttendance}
          viewerId={viewer.id}
        />
      </SectionCard>
    </AppShell>
  );
}
