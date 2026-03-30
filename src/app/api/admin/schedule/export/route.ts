import { requireRole } from "@/lib/auth";
import { getAppData } from "@/lib/data";
import { buildScheduleWorkbook, workbookToBuffer } from "@/lib/excel";

export async function GET(request: Request) {
  await requireRole("admin");

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim().toLowerCase() ?? "";
  const day = searchParams.get("day")?.trim() ?? "All days";
  const coach = searchParams.get("coach")?.trim() ?? "All coaches";
  const sort = searchParams.get("sort")?.trim() ?? "dayTime";

  const data = await getAppData();
  const rows = data.sessions
    .map((session) => {
      const sessionAttendance = data.attendance.filter((entry) => entry.sessionId === session.id);

      return {
        id: session.id,
        title: session.title,
        day: session.day,
        time: session.time,
        coach: session.coach,
        branch: session.branchId ?? "",
        room: session.room,
        capacity: session.capacity,
        registeredCount: sessionAttendance.filter((entry) => entry.status !== "Missed").length,
        presentCount: sessionAttendance.filter((entry) => entry.status === "Checked In").length,
        missedCount: sessionAttendance.filter((entry) => entry.status === "Missed").length,
        zoomReady: session.zoomLink ? "Yes" : "No",
      };
    })
    .filter((row) => {
      const matchesSearch =
        !search ||
        [row.title, row.day, row.time, row.coach, row.branch, row.room]
          .join(" ")
          .toLowerCase()
          .includes(search);
      const matchesDay = day === "All days" || row.day === day;
      const matchesCoach = coach === "All coaches" || row.coach === coach;

      return matchesSearch && matchesDay && matchesCoach;
    })
    .sort((a, b) => {
      switch (sort) {
        case "attendanceHigh":
          return b.presentCount - a.presentCount || a.title.localeCompare(b.title);
        case "coach":
          return a.coach.localeCompare(b.coach) || a.title.localeCompare(b.title);
        case "title":
          return a.title.localeCompare(b.title);
        case "dayTime":
        default:
          return `${a.day} ${a.time}`.localeCompare(`${b.day} ${b.time}`);
      }
    });

  const workbook = buildScheduleWorkbook(rows);

  return new Response(workbookToBuffer(workbook), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="gymflow-schedule.xlsx"',
    },
  });
}
