import { requireRole } from "@/lib/auth";
import { getBranchOverview } from "@/lib/branch-utils";
import { getAppData } from "@/lib/data";
import { buildBranchesWorkbook, workbookToBuffer } from "@/lib/excel";

export async function GET(request: Request) {
  await requireRole("admin");

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim().toLowerCase() ?? "";
  const kind = searchParams.get("kind")?.trim() ?? "All branch types";
  const sort = searchParams.get("sort")?.trim() ?? "name";

  const data = await getAppData();
  const branches = getBranchOverview(data)
    .filter(({ branch }) => {
      const matchesSearch =
        !search ||
        [branch.name, branch.city, branch.address, branch.managerName, branch.phone]
          .join(" ")
          .toLowerCase()
          .includes(search);
      const matchesKind = kind === "All branch types" || branch.kind === kind;

      return matchesSearch && matchesKind;
    })
    .sort((a, b) => {
      switch (sort) {
        case "membersHigh":
          return b.members.length - a.members.length || a.branch.name.localeCompare(b.branch.name);
        case "visitsHigh":
          return b.visits.length - a.visits.length || a.branch.name.localeCompare(b.branch.name);
        case "city":
          return a.branch.city.localeCompare(b.branch.city) || a.branch.name.localeCompare(b.branch.name);
        case "name":
        default:
          return a.branch.name.localeCompare(b.branch.name);
      }
    })
    .map(({ branch, members, sessions, visits, activeMemberships }) => ({
      ...branch,
      memberCount: members.length,
      sessionCount: sessions.length,
      visitCount: visits.length,
      activeMemberships,
    }));

  const workbook = buildBranchesWorkbook(branches);

  return new Response(workbookToBuffer(workbook), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="gymflow-branches.xlsx"',
    },
  });
}
