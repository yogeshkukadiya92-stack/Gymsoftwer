import { requireRole } from "@/lib/auth";
import { getAppData } from "@/lib/data";
import { buildProgressWorkbook, workbookToBuffer } from "@/lib/excel";

export async function GET(request: Request) {
  await requireRole("admin");

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim().toLowerCase() ?? "";
  const branch = searchParams.get("branch")?.trim() ?? "All branches";
  const energy = searchParams.get("energy")?.trim() ?? "All energy levels";
  const sort = searchParams.get("sort")?.trim() ?? "latestDate";

  const data = await getAppData();
  const members = data.profiles.filter((profile) => profile.role === "member");

  const rows = members
    .map((member) => {
      const checkIns = data.progressCheckIns
        .filter((entry) => entry.memberId === member.id)
        .sort((a, b) => b.recordedOn.localeCompare(a.recordedOn));

      if (checkIns.length === 0) {
        return null;
      }

      const latest = checkIns[0];
      const oldest = checkIns[checkIns.length - 1];

      return {
        memberName: member.fullName,
        branch: member.branch,
        fitnessGoal: member.fitnessGoal,
        latestDate: latest.recordedOn,
        latestWeightKg: latest.weightKg,
        firstWeightKg: oldest.weightKg,
        weightDeltaKg: Number((latest.weightKg - oldest.weightKg).toFixed(1)),
        waistCm: latest.waistCm,
        energyLevel: latest.energyLevel,
        photoCount: data.progressPhotos.filter((photo) => photo.memberId === member.id).length,
        coachNote: latest.coachNote,
      };
    })
    .filter((row) => row !== null)
    .filter((row) => {
      const matchesSearch =
        !search ||
        [row.memberName, row.branch, row.fitnessGoal, row.coachNote]
          .join(" ")
          .toLowerCase()
          .includes(search);
      const matchesBranch = branch === "All branches" || row.branch === branch;
      const matchesEnergy = energy === "All energy levels" || row.energyLevel === energy;

      return matchesSearch && matchesBranch && matchesEnergy;
    })
    .sort((a, b) => {
      switch (sort) {
        case "weightDeltaHigh":
          return b.weightDeltaKg - a.weightDeltaKg || a.memberName.localeCompare(b.memberName);
        case "name":
          return a.memberName.localeCompare(b.memberName);
        case "branch":
          return a.branch.localeCompare(b.branch) || a.memberName.localeCompare(b.memberName);
        case "latestDate":
        default:
          return b.latestDate.localeCompare(a.latestDate);
      }
    });

  const workbook = buildProgressWorkbook(rows);

  return new Response(workbookToBuffer(workbook), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="gymflow-progress.xlsx"',
    },
  });
}
