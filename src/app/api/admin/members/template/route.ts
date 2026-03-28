import { buildMembersTemplateWorkbook, workbookToBuffer } from "@/lib/excel";

export async function GET() {
  const workbook = buildMembersTemplateWorkbook();

  return new Response(workbookToBuffer(workbook), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="gymflow-members-template.xlsx"',
    },
  });
}
