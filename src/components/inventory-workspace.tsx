"use client";

import { useMemo, useState } from "react";

import { InventoryItem, InventorySale } from "@/lib/types";

type InventoryWorkspaceProps = {
  initialItems: InventoryItem[];
  initialSales: InventorySale[];
};

type ItemFormState = {
  name: string;
  category: string;
  supplementType: string;
  brand: string;
  flavor: string;
  supplierName: string;
  sku: string;
  batchCode: string;
  unitSize: string;
  expiryDate: string;
  stockUnits: string;
  reorderLevel: string;
  costPriceInr: string;
  sellingPriceInr: string;
};

type SaleFormState = {
  itemId: string;
  soldOn: string;
  quantity: string;
  customerName: string;
  paymentMethod: InventorySale["paymentMethod"];
};

type RestockFormState = {
  itemId: string;
  quantity: string;
};

function buildItemForm(): ItemFormState {
  return {
    name: "",
    category: "Supplement",
    supplementType: "",
    brand: "",
    flavor: "",
    supplierName: "",
    sku: "",
    batchCode: "",
    unitSize: "",
    expiryDate: "",
    stockUnits: "",
    reorderLevel: "",
    costPriceInr: "",
    sellingPriceInr: "",
  };
}

function buildSaleForm(itemId: string): SaleFormState {
  return {
    itemId,
    soldOn: new Date().toISOString().slice(0, 10),
    quantity: "1",
    customerName: "",
    paymentMethod: "Cash",
  };
}

function formatInr(value: number) {
  return `INR ${value}`;
}

export function InventoryWorkspace({
  initialItems,
  initialSales,
}: InventoryWorkspaceProps) {
  const [items, setItems] = useState(initialItems);
  const [sales, setSales] = useState(initialSales);
  const [searchQuery, setSearchQuery] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("All suppliers");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [sortBy, setSortBy] = useState<"name" | "stockHigh" | "stockLow" | "expirySoon" | "marginHigh">(
    "name",
  );
  const [itemForm, setItemForm] = useState<ItemFormState>(buildItemForm());
  const [saleForm, setSaleForm] = useState<SaleFormState>(
    buildSaleForm(initialItems[0]?.id ?? ""),
  );
  const [restockForm, setRestockForm] = useState<RestockFormState>({
    itemId: initialItems[0]?.id ?? "",
    quantity: "1",
  });
  const [itemMessage, setItemMessage] = useState("");
  const [saleMessage, setSaleMessage] = useState("");
  const [restockMessage, setRestockMessage] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [isSavingSale, setIsSavingSale] = useState(false);
  const [isRestocking, setIsRestocking] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.batchCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.supplementType.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSupplier =
        supplierFilter === "All suppliers" || item.supplierName === supplierFilter;
      const matchesCategory =
        categoryFilter === "All categories" || item.category === categoryFilter;
      const matchesStatus = statusFilter === "All statuses" || item.status === statusFilter;

      return matchesSearch && matchesSupplier && matchesCategory && matchesStatus;
    });
  }, [items, searchQuery, supplierFilter, categoryFilter, statusFilter]);
  const sortedItems = useMemo(
    () =>
      [...filteredItems].sort((a, b) => {
        switch (sortBy) {
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
      }),
    [filteredItems, sortBy],
  );
  const allSuppliers = useMemo(
    () =>
      Array.from(
        new Set(items.map((item) => item.supplierName).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b)),
    [items],
  );
  const allCategories = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.category).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [items],
  );
  const expiryItems = useMemo(
    () =>
      items
        .filter((item) => item.expiryDate)
        .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
        .slice(0, 5),
    [items],
  );
  const totalProfit = useMemo(
    () =>
      sales.reduce((sum, sale) => {
        const item = items.find((entry) => entry.id === sale.itemId);

        if (!item) {
          return sum;
        }

        return sum + (item.sellingPriceInr - item.costPriceInr) * sale.quantity;
      }, 0),
    [items, sales],
  );
  const filteredExportUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    }

    if (supplierFilter !== "All suppliers") {
      params.set("supplier", supplierFilter);
    }

    if (categoryFilter !== "All categories") {
      params.set("category", categoryFilter);
    }

    if (statusFilter !== "All statuses") {
      params.set("status", statusFilter);
    }

    params.set("sort", sortBy);

    return `/api/admin/inventory/export?${params.toString()}`;
  }, [categoryFilter, searchQuery, sortBy, statusFilter, supplierFilter]);

  async function handleAddItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingItem(true);
    setItemMessage("");

    const response = await fetch("/api/admin/inventory", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(itemForm),
    });

    const payload = (await response.json()) as {
      error?: string;
      message?: string;
      item?: InventoryItem;
    };

    if (!response.ok || !payload.item) {
      setItemMessage(payload.error ?? "Product add failed.");
      setIsSavingItem(false);
      return;
    }

    const nextItem = payload.item;
    setItems((current) => [nextItem, ...current]);
    setItemForm(buildItemForm());
    setItemMessage(payload.message ?? "Product added.");

    if (!saleForm.itemId) {
      setSaleForm(buildSaleForm(nextItem.id));
    }

    setIsSavingItem(false);
  }

  async function handleRecordSale(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingSale(true);
    setSaleMessage("");

    const response = await fetch("/api/admin/inventory/sales", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(saleForm),
    });

    const payload = (await response.json()) as {
      error?: string;
      message?: string;
      sale?: InventorySale;
    };

    if (!response.ok || !payload.sale) {
      setSaleMessage(payload.error ?? "Sale record failed.");
      setIsSavingSale(false);
      return;
    }

    const nextSale = payload.sale;
    const soldItem = items.find((item) => item.id === nextSale.itemId);

    setSales((current) => [nextSale, ...current]);
    if (soldItem) {
      setItems((current) =>
        current.map((item) => {
          if (item.id !== soldItem.id) {
            return item;
          }

          const nextStock = item.stockUnits - nextSale.quantity;
          return {
            ...item,
            stockUnits: nextStock,
            status:
              nextStock <= 0
                ? "Out of Stock"
                : nextStock <= item.reorderLevel
                  ? "Low Stock"
                  : "In Stock",
          };
        }),
      );
    }
    setSaleMessage(payload.message ?? "Sale recorded.");
    setSaleForm((current) => ({
      ...buildSaleForm(current.itemId),
      itemId: current.itemId,
    }));
    setIsSavingSale(false);
  }

  async function handleRestock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsRestocking(true);
    setRestockMessage("");

    const response = await fetch("/api/admin/inventory/restock", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(restockForm),
    });

    const payload = (await response.json()) as {
      error?: string;
      message?: string;
      item?: InventoryItem;
    };

    if (!response.ok || !payload.item) {
      setRestockMessage(payload.error ?? "Restock failed.");
      setIsRestocking(false);
      return;
    }

    const nextItem = payload.item;
    setItems((current) =>
      current.map((item) => (item.id === nextItem.id ? nextItem : item)),
    );
    setRestockMessage(payload.message ?? "Stock updated.");
    setRestockForm((current) => ({ ...current, quantity: "1" }));
    setIsRestocking(false);
  }

  async function downloadWorkbook(path: string, fileName: string) {
    const response = await fetch(path);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsImporting(true);
    setImportMessage("");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/inventory/import", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json()) as {
      error?: string;
      message?: string;
      sampleItems?: Array<{
        name: string;
        sku: string;
        supplierName: string;
        expiryDate: string;
      }>;
    };

    if (!response.ok) {
      setImportMessage(payload.error ?? "Inventory import failed.");
      setIsImporting(false);
      event.target.value = "";
      return;
    }

    window.location.reload();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-6">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                downloadWorkbook(filteredExportUrl, "gymflow-inventory.xlsx")
              }
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:text-orange-700"
            >
              Export current inventory view
            </button>
            <button
              type="button"
              onClick={() =>
                downloadWorkbook(
                  "/api/admin/inventory/template",
                  "gymflow-inventory-template.xlsx",
                )
              }
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:text-orange-700"
            >
              Download template
            </button>
            <label className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
              {isImporting ? "Importing..." : "Import inventory"}
              <input
                type="file"
                accept=".xlsx"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>
          <p className="mt-3 text-sm text-slate-500">{importMessage}</p>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
          <h3 className="font-serif text-2xl text-slate-950">Search and filter</h3>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <input
              type="text"
              placeholder="Search by name, SKU, or batch"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
            />
            <select
              value={supplierFilter}
              onChange={(event) => setSupplierFilter(event.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
            >
              <option value="All suppliers">All suppliers</option>
              {allSuppliers.map((supplier) => (
                <option key={supplier} value={supplier}>
                  {supplier}
                </option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
            >
              <option value="All categories">All categories</option>
              {allCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
            >
              <option value="All statuses">All statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(
                  event.target.value as
                    | "name"
                    | "stockHigh"
                    | "stockLow"
                    | "expirySoon"
                    | "marginHigh",
                )
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 sm:col-span-2 lg:col-span-2"
            >
              <option value="name">Sort: Name</option>
              <option value="stockHigh">Sort: Highest stock</option>
              <option value="stockLow">Sort: Lowest stock</option>
              <option value="expirySoon">Sort: Expiry soon</option>
              <option value="marginHigh">Sort: Highest margin</option>
            </select>
          </div>
        </div>

        <form
          onSubmit={handleAddItem}
          className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]"
        >
          <h3 className="font-serif text-2xl text-slate-950">Add new product</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Product name"
              value={itemForm.name}
              onChange={(event) =>
                setItemForm((current) => ({ ...current, name: event.target.value }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 sm:col-span-2"
            />
            <select
              value={itemForm.category}
              onChange={(event) =>
                setItemForm((current) => ({
                  ...current,
                  category: event.target.value,
                }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
            >
              <option value="Protein">Protein</option>
              <option value="Supplement">Supplement</option>
              <option value="Pre-workout">Pre-workout</option>
              <option value="Creatine">Creatine</option>
              <option value="Vitamin">Vitamin</option>
              <option value="Snack">Snack</option>
              <option value="Accessory">Accessory</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="text"
              placeholder="Supplement type"
              value={itemForm.supplementType}
              onChange={(event) =>
                setItemForm((current) => ({
                  ...current,
                  supplementType: event.target.value,
                }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
            />
            <input
              type="text"
              placeholder="Brand"
              value={itemForm.brand}
              onChange={(event) =>
                setItemForm((current) => ({ ...current, brand: event.target.value }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
            />
            <input
              type="text"
              placeholder="Flavor"
              value={itemForm.flavor}
              onChange={(event) =>
                setItemForm((current) => ({ ...current, flavor: event.target.value }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
            />
            <input
              type="text"
              placeholder="Supplier name"
              value={itemForm.supplierName}
              onChange={(event) =>
                setItemForm((current) => ({
                  ...current,
                  supplierName: event.target.value,
                }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
            />
            <input
              type="text"
              placeholder="SKU"
              value={itemForm.sku}
              onChange={(event) =>
                setItemForm((current) => ({ ...current, sku: event.target.value }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
            />
            <input
              type="text"
              placeholder="Batch code"
              value={itemForm.batchCode}
              onChange={(event) =>
                setItemForm((current) => ({ ...current, batchCode: event.target.value }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
            />
            <input
              type="text"
              placeholder="Unit size"
              value={itemForm.unitSize}
              onChange={(event) =>
                setItemForm((current) => ({ ...current, unitSize: event.target.value }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
            />
            <input
              type="date"
              value={itemForm.expiryDate}
              onChange={(event) =>
                setItemForm((current) => ({ ...current, expiryDate: event.target.value }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
            />
            <input
              type="number"
              placeholder="Stock units"
              value={itemForm.stockUnits}
              onChange={(event) =>
                setItemForm((current) => ({
                  ...current,
                  stockUnits: event.target.value,
                }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
            />
            <input
              type="number"
              placeholder="Reorder level"
              value={itemForm.reorderLevel}
              onChange={(event) =>
                setItemForm((current) => ({
                  ...current,
                  reorderLevel: event.target.value,
                }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
            />
            <input
              type="number"
              placeholder="Cost price"
              value={itemForm.costPriceInr}
              onChange={(event) =>
                setItemForm((current) => ({
                  ...current,
                  costPriceInr: event.target.value,
                }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
            />
            <input
              type="number"
              placeholder="Selling price"
              value={itemForm.sellingPriceInr}
              onChange={(event) =>
                setItemForm((current) => ({
                  ...current,
                  sellingPriceInr: event.target.value,
                }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
            />
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">{itemMessage}</p>
            <button
              type="submit"
              disabled={isSavingItem}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {isSavingItem ? "Saving..." : "Add product"}
            </button>
          </div>
        </form>

        <form
          onSubmit={handleRecordSale}
          className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]"
        >
          <h3 className="font-serif text-2xl text-slate-950">Record a sale</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <select
              value={saleForm.itemId}
              onChange={(event) =>
                setSaleForm((current) => ({ ...current, itemId: event.target.value }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 sm:col-span-2"
            >
              {sortedItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.stockUnits} in stock)
                </option>
              ))}
            </select>
            <input
              type="date"
              value={saleForm.soldOn}
              onChange={(event) =>
                setSaleForm((current) => ({ ...current, soldOn: event.target.value }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
            />
            <input
              type="number"
              placeholder="Quantity"
              value={saleForm.quantity}
              onChange={(event) =>
                setSaleForm((current) => ({ ...current, quantity: event.target.value }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
            />
            <input
              type="text"
              placeholder="Customer name"
              value={saleForm.customerName}
              onChange={(event) =>
                setSaleForm((current) => ({
                  ...current,
                  customerName: event.target.value,
                }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
            />
            <select
              value={saleForm.paymentMethod}
              onChange={(event) =>
                setSaleForm((current) => ({
                  ...current,
                  paymentMethod: event.target.value as InventorySale["paymentMethod"],
                }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">{saleMessage}</p>
            <button
              type="submit"
              disabled={isSavingSale}
              className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
            >
              {isSavingSale ? "Saving..." : "Record sale"}
            </button>
          </div>
        </form>

        <form
          onSubmit={handleRestock}
          className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]"
        >
          <h3 className="font-serif text-2xl text-slate-950">Restock product</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <select
              value={restockForm.itemId}
              onChange={(event) =>
                setRestockForm((current) => ({ ...current, itemId: event.target.value }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
            >
              {sortedItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Add units"
              value={restockForm.quantity}
              onChange={(event) =>
                setRestockForm((current) => ({
                  ...current,
                  quantity: event.target.value,
                }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
            />
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">{restockMessage}</p>
            <button
              type="submit"
              disabled={isRestocking}
              className="rounded-full bg-orange-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-orange-400 disabled:opacity-60"
            >
              {isRestocking ? "Updating..." : "Restock"}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
          <h3 className="font-serif text-2xl text-slate-950">Expiry watchlist</h3>
          <div className="mt-4 space-y-3">
            {expiryItems.map((item) => (
              <div key={item.id} className="rounded-[1.25rem] bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-950">{item.name}</p>
                  <p className="text-sm text-amber-700">{item.expiryDate}</p>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {item.supplierName || "Supplier not set"} • Batch {item.batchCode || "-"}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
          <h3 className="font-serif text-2xl text-slate-950">Margin summary</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.25rem] bg-emerald-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">Gross sales</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-900">
                {formatInr(sales.reduce((sum, sale) => sum + sale.totalAmountInr, 0))}
              </p>
            </div>
            <div className="rounded-[1.25rem] bg-orange-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-orange-700">Estimated profit</p>
              <p className="mt-2 text-2xl font-semibold text-orange-900">
                {formatInr(totalProfit)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
          <h3 className="font-serif text-2xl text-slate-950">Current inventory</h3>
          <div className="mt-4 space-y-3">
            {sortedItems.map((item) => (
              <div key={item.id} className="rounded-[1.25rem] bg-slate-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">{item.name}</p>
                    <p className="text-sm text-slate-600">
                      {item.brand} • {item.supplementType || item.category} • {item.unitSize}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.flavor ? `${item.flavor} • ` : ""}
                      Batch {item.batchCode || "-"} • Expiry {item.expiryDate || "-"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Supplier {item.supplierName || "-"} • SKU {item.sku}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.status === "In Stock"
                        ? "bg-emerald-100 text-emerald-700"
                        : item.status === "Low Stock"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <p className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-700">
                    Stock {item.stockUnits}
                  </p>
                  <p className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-700">
                    Reorder {item.reorderLevel}
                  </p>
                  <p className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-700">
                    Cost {formatInr(item.costPriceInr)}
                  </p>
                  <p className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-700">
                    Price {formatInr(item.sellingPriceInr)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
          <h3 className="font-serif text-2xl text-slate-950">Recent sales</h3>
          <div className="mt-4 space-y-3">
            {sales.map((sale) => {
              const item = items.find((entry) => entry.id === sale.itemId);

              return (
                <div key={sale.id} className="rounded-[1.25rem] bg-slate-50 p-4">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{item?.name ?? "Product"}</p>
                      <p className="text-sm text-slate-600">
                        {sale.customerName} • {sale.soldOn}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-emerald-700">
                      {sale.quantity} unit • {formatInr(sale.totalAmountInr)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{sale.paymentMethod}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
