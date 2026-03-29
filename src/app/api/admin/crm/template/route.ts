import { requireRole } from "@/lib/auth";
import { buildLeadsTemplateWorkbook, workbookToBuffer } from "@/lib/excel";

export async function GET() {
  await requireRole("admin");

  const workbook = buildLeadsTemplateWorkbook();

  return new Response(workbookToBuffer(workbook), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="gymflow-leads-template.xlsx"',
    },
  });
}
