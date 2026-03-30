import { requireRole } from "@/lib/auth";
import { getAppData } from "@/lib/data";
import { buildWorkoutPlansWorkbook, workbookToBuffer } from "@/lib/excel";

export async function GET(request: Request) {
  await requireRole("admin");

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim().toLowerCase() ?? "";
  const coach = searchParams.get("coach")?.trim() ?? "All coaches";
  const assignmentStatus = searchParams.get("assignmentStatus")?.trim() ?? "All assignments";
  const sort = searchParams.get("sort")?.trim() ?? "name";

  const data = await getAppData();

  const planRows = data.workoutPlans
    .map((plan) => ({
      id: plan.id,
      name: plan.name,
      goal: plan.goal,
      coach: plan.coach,
      split: plan.split,
      durationWeeks: plan.durationWeeks,
      exerciseCount: plan.exercises.length,
    }))
    .filter((plan) => {
      const matchesSearch =
        !search ||
        [plan.name, plan.goal, plan.coach, plan.split].join(" ").toLowerCase().includes(search);
      const matchesCoach = coach === "All coaches" || plan.coach === coach;
      return matchesSearch && matchesCoach;
    })
    .sort((a, b) => {
      switch (sort) {
        case "coach":
          return a.coach.localeCompare(b.coach) || a.name.localeCompare(b.name);
        case "durationHigh":
          return b.durationWeeks - a.durationWeeks || a.name.localeCompare(b.name);
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const includedPlanIds = new Set(planRows.map((plan) => plan.id));

  const assignmentRows = data.assignments
    .filter(
      (assignment) =>
        includedPlanIds.has(assignment.planId) &&
        (assignmentStatus === "All assignments" || assignment.status === assignmentStatus),
    )
    .map((assignment) => {
      const member = data.profiles.find((entry) => entry.id === assignment.memberId);
      const plan = data.workoutPlans.find((entry) => entry.id === assignment.planId);

      return {
        id: assignment.id,
        memberName: member?.fullName ?? "",
        memberEmail: member?.email ?? "",
        planName: plan?.name ?? "",
        startDate: assignment.startDate,
        status: assignment.status,
      };
    });

  const workbook = buildWorkoutPlansWorkbook(planRows, assignmentRows);

  return new Response(workbookToBuffer(workbook), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="gymflow-workout-plans.xlsx"',
    },
  });
}
