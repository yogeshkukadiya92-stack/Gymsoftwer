import { recordInventorySale } from "@/lib/app-data-store";
import { InventorySale } from "@/lib/types";

function parseNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<InventorySale>;

  if (!body.itemId?.trim()) {
    return Response.json({ error: "Product is required." }, { status: 400 });
  }

  try {
    const sale = await recordInventorySale({
      itemId: body.itemId,
      soldOn: body.soldOn?.trim() || new Date().toISOString().slice(0, 10),
      quantity: parseNumber(body.quantity),
      customerName: body.customerName?.trim() || "Walk-in customer",
      paymentMethod: (body.paymentMethod ?? "Cash") as InventorySale["paymentMethod"],
    });

    return Response.json({
      message: "Sale recorded successfully.",
      sale,
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Sale recording failed.",
      },
      { status: 400 },
    );
  }
}
