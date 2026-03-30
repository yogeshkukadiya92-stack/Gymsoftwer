import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { MemberSessionList } from "@/components/member-session-list";
import { SectionCard } from "@/components/section-card";
import { getDashboardData } from "@/lib/data";
import {
  filterNavLinksByRoutes,
  getAllowedRoutesForProfile,
  getPortalFallbackRoute,
  memberPortalRoutes,
  routeIsAllowed,
} from "@/lib/user-permissions";

export default async function MemberSchedulePage() {
  const { data, viewer } = await getDashboardData("member");
  const allowedRoutes = getAllowedRoutesForProfile(viewer, data.userPermissions);
  if (!routeIsAllowed("/member/schedule", allowedRoutes)) {
    redirect(getPortalFallbackRoute(viewer, data));
  }
  const navLinks = filterNavLinksByRoutes(memberPortalRoutes, allowedRoutes);
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
