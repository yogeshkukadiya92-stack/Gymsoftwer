import { requireRole } from "@/lib/auth";
import { getAppData } from "@/lib/data";
import { buildBillingWorkbook, workbookToBuffer } from "@/lib/excel";

export async function GET() {
  await requireRole("admin");

  const data = await getAppData();
  const workbook = buildBillingWorkbook(data);

  return new Response(workbookToBuffer(workbook), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="gymflow-billing-report.xlsx"',
    },
  });
}
