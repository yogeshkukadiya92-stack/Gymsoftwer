import {
  AppData,
  BranchVisit,
  ClassSession,
  GymBranch,
  Membership,
  Profile,
} from "@/lib/types";

function slugifyBranchName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function getBranchCatalog(data: AppData) {
  const names = Array.from(
    new Set(
      (data.profiles ?? [])
        .map((profile) => profile.branch.trim())
        .filter(Boolean),
    ),
  );

  const derivedBranches = names.map(
    (name) =>
      ({
        id: slugifyBranchName(name),
        name,
        city: "",
        address: "",
        managerName: "",
        phone: "",
        kind: "Physical",
      }) satisfies GymBranch,
  );

  const mergedMap = new Map<string, GymBranch>();

  [...(data.gymBranches ?? []), ...derivedBranches].forEach((branch) => {
    if (!mergedMap.has(branch.id)) {
      mergedMap.set(branch.id, branch);
    }
  });

  return Array.from(mergedMap.values());
}

export function getBranchVisits(data: AppData) {
  const sessionsById = new Map((data.sessions ?? []).map((session) => [session.id, session]));

  const derivedVisits = (data.attendance ?? []).flatMap((entry) => {
    const session = sessionsById.get(entry.sessionId);

    if (!session?.branchId || entry.status === "Missed") {
      return [];
    }

    return [
      {
        id: `visit-${entry.id}`,
        memberId: entry.memberId,
        branchId: session.branchId,
        visitDate: `2026-03-${String((entry.sessionId.length % 20) + 8).padStart(2, "0")}`,
        source: "Attendance",
        note: `${session.title} joined via ${entry.status}.`,
      } satisfies BranchVisit,
    ];
  });

  const mergedMap = new Map<string, BranchVisit>();

  [...(data.branchVisits ?? []), ...derivedVisits].forEach((visit) => {
    if (!mergedMap.has(visit.id)) {
      mergedMap.set(visit.id, visit);
    }
  });

  return Array.from(mergedMap.values());
}

export function getUserBranchHistory(
  user: Profile,
  branches: GymBranch[],
  visits: BranchVisit[],
  sessions: ClassSession[],
  memberships: Membership[],
) {
  const branchMap = new Map(branches.map((branch) => [branch.id, branch]));
  const userMembership = memberships.find((membership) => membership.memberId === user.id);
  const userVisits = visits
    .filter((visit) => visit.memberId === user.id)
    .sort((left, right) => right.visitDate.localeCompare(left.visitDate));

  const branchSummary = new Map<
    string,
    { branch: GymBranch | undefined; count: number; lastVisit: string; notes: string[] }
  >();

  userVisits.forEach((visit) => {
    const current = branchSummary.get(visit.branchId);

    if (!current) {
      branchSummary.set(visit.branchId, {
        branch: branchMap.get(visit.branchId),
        count: 1,
        lastVisit: visit.visitDate,
        notes: [visit.note],
      });
      return;
    }

    current.count += 1;
    if (visit.visitDate > current.lastVisit) {
      current.lastVisit = visit.visitDate;
    }
    if (visit.note) {
      current.notes = Array.from(new Set([...current.notes, visit.note]));
    }
  });

  const attendedSessionCount = sessions.filter((session) =>
    userVisits.some((visit) => visit.branchId === session.branchId),
  ).length;

  return {
    homeBranch:
      branches.find((branch) => branch.name === user.branch) ??
      (user.branch
        ? ({
            id: slugifyBranchName(user.branch),
            name: user.branch,
            city: "",
            address: "",
            managerName: "",
            phone: "",
            kind: "Physical",
          } as GymBranch)
        : undefined),
    branchSummary: Array.from(branchSummary.values()).sort((left, right) =>
      right.lastVisit.localeCompare(left.lastVisit),
    ),
    totalVisitedBranches: branchSummary.size,
    totalVisits: userVisits.length,
    attendedSessionCount,
    activeMembershipStatus: userMembership?.status ?? "No active membership",
  };
}

export function getBranchOverview(data: AppData) {
  const branches = getBranchCatalog(data);
  const visits = getBranchVisits(data);

  return branches.map((branch) => {
    const branchMembers = (data.profiles ?? []).filter((profile) => profile.branch === branch.name);
    const branchSessions = (data.sessions ?? []).filter((session) => session.branchId === branch.id);
    const branchVisits = visits.filter((visit) => visit.branchId === branch.id);
    const activeMemberships = (data.memberships ?? []).filter((membership) =>
      branchMembers.some((member) => member.id === membership.memberId && membership.status === "Active"),
    ).length;

    return {
      branch,
      members: branchMembers,
      sessions: branchSessions,
      visits: branchVisits,
      activeMemberships,
    };
  });
}
