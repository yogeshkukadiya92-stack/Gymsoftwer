import { getAuthenticatedProfile, importManagedUsers } from "@/lib/auth";
import { parseUsersWorkbook } from "@/lib/excel";

export async function POST(request: Request) {
  const profile = await getAuthenticatedProfile();

  if (!profile || profile.role !== "admin") {
    return Response.json({ error: "Admin login required for user import." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "Please attach a users .xlsx file." }, { status: 400 });
  }

  try {
    const parsed = parseUsersWorkbook(await file.arrayBuffer());
    const saved = await importManagedUsers(parsed.users);

    return Response.json({
      message: "Users workbook imported successfully.",
      summary: parsed.summary,
      duplicateEmails: parsed.duplicateEmails,
      saved: {
        imported: saved.imported.length,
        updated: saved.updated.length,
      },
      sampleUsers: parsed.users.slice(0, 5).map((user) => ({
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        branch: user.branch,
      })),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Users workbook import failed." },
      { status: 400 },
    );
  }
}
