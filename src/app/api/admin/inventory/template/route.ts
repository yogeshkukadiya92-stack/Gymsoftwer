import { buildInventoryTemplateWorkbook, workbookToBuffer } from "@/lib/excel";

export async function GET() {
  const workbook = buildInventoryTemplateWorkbook();

  return new Response(workbookToBuffer(workbook), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="gymflow-inventory-template.xlsx"',
    },
  });
}
