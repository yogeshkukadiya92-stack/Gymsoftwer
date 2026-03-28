import { restockInventoryItem } from "@/lib/app-data-store";

function parseNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    itemId?: string;
    quantity?: number | string;
  };

  if (!body.itemId?.trim()) {
    return Response.json({ error: "Product is required." }, { status: 400 });
  }

  try {
    const item = await restockInventoryItem(body.itemId, parseNumber(body.quantity));

    return Response.json({
      message: "Stock updated successfully.",
      item,
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Restock failed.",
      },
      { status: 400 },
    );
  }
}
