import { getAppData } from "@/lib/data";
import { buildInventoryWorkbook, workbookToBuffer } from "@/lib/excel";

export async function GET() {
  const data = await getAppData();
  const workbook = buildInventoryWorkbook(data.inventoryItems, data.inventorySales);

  return new Response(workbookToBuffer(workbook), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="gymflow-inventory.xlsx"',
    },
  });
}
