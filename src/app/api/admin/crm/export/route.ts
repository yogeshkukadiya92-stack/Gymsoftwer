import { requireRole } from "@/lib/auth";
import { getLeadRecords } from "@/lib/business-data-store";
import { buildLeadsWorkbook, workbookToBuffer } from "@/lib/excel";

export async function GET() {
  await requireRole("admin");

  const leads = await getLeadRecords();
  const workbook = buildLeadsWorkbook(leads);

  return new Response(workbookToBuffer(workbook), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="gymflow-leads.xlsx"',
    },
  });
}
