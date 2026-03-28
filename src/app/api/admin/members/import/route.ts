import { importMembersToAppData } from "@/lib/app-data-store";
import { parseMembersWorkbook } from "@/lib/excel";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json(
      { error: "Please attach a members .xlsx file." },
      { status: 400 },
    );
  }

  try {
    const parsed = parseMembersWorkbook(await file.arrayBuffer());
    const saved = await importMembersToAppData(parsed.members);

    return Response.json({
      message:
        "Members workbook imported successfully. Member records have been saved to the app data store.",
      summary: parsed.summary,
      preview: {
        members: parsed.members.length,
      },
      saved: {
        imported: saved.imported.length,
        updated: saved.updated.length,
        totalProfiles: saved.totalProfiles,
      },
      duplicateEmails: parsed.duplicateEmails,
      sampleMembers: parsed.members.slice(0, 5).map((member) => ({
        fullName: member.fullName,
        email: member.email,
        phone: member.phone,
        branch: member.branch,
      })),
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Members workbook import failed.",
      },
      { status: 400 },
    );
  }
}
