import { createInventoryItem } from "@/lib/app-data-store";
import { InventoryItem } from "@/lib/types";

function parseNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<InventoryItem>;

  if (!body.name?.trim()) {
    return Response.json({ error: "Product name is required." }, { status: 400 });
  }

  const item = await createInventoryItem({
    name: body.name,
    category: body.category?.trim() ?? "Supplement",
    supplementType: body.supplementType?.trim() ?? "General",
    brand: body.brand?.trim() ?? "",
    flavor: body.flavor?.trim() ?? "",
    supplierName: body.supplierName?.trim() ?? "",
    sku: body.sku?.trim() ?? "",
    batchCode: body.batchCode?.trim() ?? "",
    unitSize: body.unitSize?.trim() ?? "",
    expiryDate: body.expiryDate?.trim() ?? "",
    stockUnits: parseNumber(body.stockUnits),
    reorderLevel: parseNumber(body.reorderLevel),
    costPriceInr: parseNumber(body.costPriceInr),
    sellingPriceInr: parseNumber(body.sellingPriceInr),
  });

  return Response.json({
    message: "Inventory item added successfully.",
    item,
  });
}
