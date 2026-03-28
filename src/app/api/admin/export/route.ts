import { getAppData } from "@/lib/data";
import { buildWorkbookFromAppData, workbookToBuffer } from "@/lib/excel";

export async function GET() {
  const data = await getAppData();
  const workbook = buildWorkbookFromAppData(data);
  const buffer = workbookToBuffer(workbook);

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="gymflow-export.xlsx"',
    },
  });
}
