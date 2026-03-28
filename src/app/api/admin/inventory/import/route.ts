import { importInventoryItemsToAppData } from "@/lib/app-data-store";
import { parseInventoryWorkbook } from "@/lib/excel";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json(
      { error: "Please attach an inventory .xlsx file." },
      { status: 400 },
    );
  }

  try {
    const parsed = parseInventoryWorkbook(await file.arrayBuffer());
    const saved = await importInventoryItemsToAppData(parsed.items);

    return Response.json({
      message: "Inventory workbook imported successfully.",
      summary: parsed.summary,
      saved: {
        imported: saved.imported.length,
        updated: saved.updated.length,
        totalItems: saved.totalItems,
      },
      sampleItems: parsed.items.slice(0, 5).map((item) => ({
        name: item.name,
        sku: item.sku,
        supplierName: item.supplierName,
        expiryDate: item.expiryDate,
      })),
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Inventory workbook import failed.",
      },
      { status: 400 },
    );
  }
}
