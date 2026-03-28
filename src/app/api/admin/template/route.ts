import { getAppData } from "@/lib/data";
import { buildTemplateWorkbook, workbookToBuffer } from "@/lib/excel";

export async function GET() {
  const data = await getAppData();
  const workbook = buildTemplateWorkbook(data);
  const buffer = workbookToBuffer(workbook);

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="gymflow-import-template.xlsx"',
    },
  });
}
