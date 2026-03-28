import { parseAttendanceWorkbook } from "@/lib/excel";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json(
      { error: "Please attach an attendance .xlsx file." },
      { status: 400 },
    );
  }

  try {
    const parsed = parseAttendanceWorkbook(await file.arrayBuffer());

    return Response.json({
      message:
        "Attendance workbook parsed successfully. This validates the structure and row counts for sessions and attendees.",
      summary: parsed.summary,
      preview: {
        sessions: parsed.sessions.length,
        attendees: parsed.attendance.length,
      },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Attendance workbook import failed.",
      },
      { status: 400 },
    );
  }
}
