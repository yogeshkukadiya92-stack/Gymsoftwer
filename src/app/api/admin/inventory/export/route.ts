import { requireRole } from "@/lib/auth";
import { getAppData } from "@/lib/data";
import { buildInventoryWorkbook, workbookToBuffer } from "@/lib/excel";

export async function GET(request: Request) {
  await requireRole("admin");

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim().toLowerCase() ?? "";
  const supplier = searchParams.get("supplier")?.trim() ?? "All suppliers";
  const category = searchParams.get("category")?.trim() ?? "All categories";
  const status = searchParams.get("status")?.trim() ?? "All statuses";
  const sort = searchParams.get("sort")?.trim() ?? "name";

  const data = await getAppData();
  const filteredItems = data.inventoryItems
    .filter((item) => {
      const matchesSearch =
        !search ||
        [item.name, item.sku, item.batchCode, item.brand, item.supplementType, item.flavor]
          .join(" ")
          .toLowerCase()
          .includes(search);
      const matchesSupplier = supplier === "All suppliers" || item.supplierName === supplier;
      const matchesCategory = category === "All categories" || item.category === category;
      const matchesStatus = status === "All statuses" || item.status === status;

      return matchesSearch && matchesSupplier && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      switch (sort) {
        case "stockHigh":
          return b.stockUnits - a.stockUnits || a.name.localeCompare(b.name);
        case "stockLow":
          return a.stockUnits - b.stockUnits || a.name.localeCompare(b.name);
        case "expirySoon":
          return (a.expiryDate || "9999-12-31").localeCompare(b.expiryDate || "9999-12-31");
        case "marginHigh":
          return (
            b.sellingPriceInr -
            b.costPriceInr -
            (a.sellingPriceInr - a.costPriceInr) ||
            a.name.localeCompare(b.name)
          );
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const filteredItemIds = new Set(filteredItems.map((item) => item.id));
  const filteredSales = data.inventorySales.filter((sale) => filteredItemIds.has(sale.itemId));
  const workbook = buildInventoryWorkbook(filteredItems, filteredSales);

  return new Response(workbookToBuffer(workbook), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="gymflow-inventory.xlsx"',
    },
  });
}
