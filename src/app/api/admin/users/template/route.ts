import { requireRole } from "@/lib/auth";
import { buildUsersTemplateWorkbook, workbookToBuffer } from "@/lib/excel";

export async function GET() {
  await requireRole("admin");

  const workbook = buildUsersTemplateWorkbook();

  return new Response(workbookToBuffer(workbook), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="gymflow-users-template.xlsx"',
    },
  });
}
