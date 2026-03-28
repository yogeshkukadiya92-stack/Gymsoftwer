import { parseImportWorkbook } from "@/lib/excel";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json(
      { error: "Please attach an .xlsx file in the file field." },
      { status: 400 },
    );
  }

  const arrayBuffer = await file.arrayBuffer();

  try {
    const parsed = parseImportWorkbook(arrayBuffer);

    return Response.json({
      message:
        "Workbook parsed successfully. This MVP validates and previews data; persistence can be wired to Supabase next.",
      summary: parsed.summary,
      preview: {
        profiles: parsed.data.profiles.length,
        memberships: parsed.data.memberships.length,
        exercises: parsed.data.exercises.length,
        workoutPlans: parsed.data.workoutPlans.length,
        assignments: parsed.data.assignments.length,
        workoutLogs: parsed.data.workoutLogs.length,
        sessions: parsed.data.sessions.length,
        attendance: parsed.data.attendance.length,
      },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Workbook import failed.",
      },
      { status: 400 },
    );
  }
}
