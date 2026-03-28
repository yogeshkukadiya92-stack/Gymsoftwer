import { AppShell } from "@/components/app-shell";
import { InventoryWorkspace } from "@/components/inventory-workspace";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { adminNavLinks } from "@/lib/admin-nav";
import { getAppData } from "@/lib/data";

function formatInr(value: number) {
  return `INR ${value}`;
}

export default async function AdminInventoryPage() {
  const data = await getAppData();
  const lowStockItems = data.inventoryItems.filter((item) => item.status === "Low Stock");
  const outOfStockItems = data.inventoryItems.filter(
    (item) => item.status === "Out of Stock",
  );
  const inventoryValue = data.inventoryItems.reduce(
    (sum, item) => sum + item.stockUnits * item.costPriceInr,
    0,
  );
  const salesRevenue = data.inventorySales.reduce(
    (sum, sale) => sum + sale.totalAmountInr,
    0,
  );
  const profitEstimate = data.inventorySales.reduce((sum, sale) => {
    const item = data.inventoryItems.find((entry) => entry.id === sale.itemId);

    if (!item) {
      return sum;
    }

    return sum + (item.sellingPriceInr - item.costPriceInr) * sale.quantity;
  }, 0);

  return (
    <AppShell
      role="admin"
      title="Inventory manager"
      subtitle="Track protein powder, supplements, snacks, and product sales with live stock visibility for your gym."
      navLinks={adminNavLinks}
    >
      <div className="grid gap-6 lg:grid-cols-4">
        <StatCard
          label="Products"
          value={String(data.inventoryItems.length)}
          detail="Total inventory items currently tracked."
        />
        <StatCard
          label="Low stock"
          value={String(lowStockItems.length)}
          detail="Products that are at or below their reorder level."
        />
        <StatCard
          label="Stock value"
          value={formatInr(inventoryValue)}
          detail="Estimated value of current stock at cost price."
        />
        <StatCard
          label="Sales"
          value={formatInr(salesRevenue)}
          detail="Revenue captured from product sales on record."
        />
        <StatCard
          label="Profit"
          value={formatInr(profitEstimate)}
          detail="Estimated product margin from recorded sales."
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionCard eyebrow="Alerts" title="Stock watchlist">
          <div className="space-y-4">
            {outOfStockItems.length === 0 && lowStockItems.length === 0 ? (
              <div className="rounded-[1.5rem] bg-emerald-50 p-4 text-sm text-emerald-700">
                All inventory items are comfortably stocked right now.
              </div>
            ) : null}

            {outOfStockItems.map((item) => (
              <div key={item.id} className="rounded-[1.5rem] bg-rose-50 p-4">
                <p className="font-semibold text-rose-900">{item.name}</p>
                <p className="mt-2 text-sm text-rose-700">
                  Out of stock. Reorder level was {item.reorderLevel} units.
                </p>
              </div>
            ))}

            {lowStockItems.map((item) => (
              <div key={item.id} className="rounded-[1.5rem] bg-amber-50 p-4">
                <p className="font-semibold text-amber-900">{item.name}</p>
                <p className="mt-2 text-sm text-amber-700">
                  {item.stockUnits} unit(s) left. Reorder before it goes out of stock.
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard eyebrow="Products" title="Inventory control">
          <InventoryWorkspace
            initialItems={data.inventoryItems}
            initialSales={data.inventorySales}
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}
