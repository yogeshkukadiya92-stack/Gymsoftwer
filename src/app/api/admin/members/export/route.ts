import { getAppData } from "@/lib/data";
import { buildMembersWorkbook, workbookToBuffer } from "@/lib/excel";

export async function GET() {
  const data = await getAppData();
  const workbook = buildMembersWorkbook(data.profiles);

  return new Response(workbookToBuffer(workbook), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="gymflow-members.xlsx"',
    },
  });
}
