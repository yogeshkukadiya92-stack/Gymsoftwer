import { getAppData } from "@/lib/data";
import { buildAttendanceWorkbook, workbookToBuffer } from "@/lib/excel";

export async function GET() {
  const data = await getAppData();
  const workbook = buildAttendanceWorkbook(
    data.sessions,
    data.attendance,
    data.profiles,
  );

  return new Response(workbookToBuffer(workbook), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="gymflow-attendance.xlsx"',
    },
  });
}
