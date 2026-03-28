import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { mockData } from "@/lib/mock-data";
import {
  AppData,
  InventoryItem,
  InventorySale,
  Profile,
  ProgressCheckIn,
  ProgressPhoto,
} from "@/lib/types";

const dataDirectory = path.join(process.cwd(), "data");
const storePath = path.join(dataDirectory, "app-data.json");

function normalizeAppData(data: AppData): AppData {
  return {
    ...data,
    invoices: data.invoices ?? [],
    inventoryItems: (data.inventoryItems ?? []).map((item) => ({
      ...item,
      category: item.category ?? "Supplement",
      supplementType: item.supplementType ?? "",
      flavor: item.flavor ?? "",
      supplierName: item.supplierName ?? "",
      batchCode: item.batchCode ?? "",
      expiryDate: item.expiryDate ?? "",
    })),
    inventorySales: data.inventorySales ?? [],
    progressCheckIns: data.progressCheckIns ?? [],
    progressPhotos: data.progressPhotos ?? [],
  };
}

async function ensureStore() {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(storePath, "utf8");
  } catch {
    await writeFile(storePath, JSON.stringify(mockData, null, 2), "utf8");
  }
}

export async function readAppDataStore(): Promise<AppData> {
  await ensureStore();
  const raw = await readFile(storePath, "utf8");
  return normalizeAppData(JSON.parse(raw) as AppData);
}

export async function writeAppDataStore(data: AppData) {
  await ensureStore();
  await writeFile(storePath, JSON.stringify(normalizeAppData(data), null, 2), "utf8");
}

export async function importMembersToAppData(members: Profile[]) {
  const store = await readAppDataStore();
  const existingProfiles = [...store.profiles];
  const imported: Profile[] = [];
  const updated: Profile[] = [];

  members.forEach((member) => {
    const existingIndex = existingProfiles.findIndex(
      (profile) =>
        profile.id === member.id ||
        profile.email.trim().toLowerCase() === member.email.trim().toLowerCase(),
    );

    if (existingIndex >= 0) {
      existingProfiles[existingIndex] = {
        ...existingProfiles[existingIndex],
        ...member,
        role: "member",
      };
      updated.push(existingProfiles[existingIndex]);
      return;
    }

    const nextMember: Profile = {
      ...member,
      role: "member",
      id: member.id || `member-${crypto.randomUUID()}`,
      joinedOn: member.joinedOn || new Date().toISOString().slice(0, 10),
    };

    existingProfiles.push(nextMember);
    imported.push(nextMember);
  });

  const nextStore: AppData = {
    ...store,
    profiles: existingProfiles,
  };

  await writeAppDataStore(nextStore);

  return {
    imported,
    updated,
    totalProfiles: nextStore.profiles.length,
  };
}

type ProgressCheckInInput = Omit<ProgressCheckIn, "id">;
type ProgressPhotoInput = Omit<ProgressPhoto, "id">;

export async function createProgressCheckIn(input: ProgressCheckInInput) {
  const store = await readAppDataStore();
  const nextEntry: ProgressCheckIn = {
    id: `progress-${crypto.randomUUID()}`,
    ...input,
  };

  const nextStore: AppData = {
    ...store,
    progressCheckIns: [nextEntry, ...store.progressCheckIns],
  };

  await writeAppDataStore(nextStore);

  return nextEntry;
}

export async function updateProgressCheckIn(
  id: string,
  input: ProgressCheckInInput,
) {
  const store = await readAppDataStore();
  const existing = store.progressCheckIns.find((entry) => entry.id === id);

  if (!existing) {
    throw new Error("Progress entry not found.");
  }

  const nextEntry: ProgressCheckIn = {
    ...existing,
    ...input,
    id,
  };

  const nextStore: AppData = {
    ...store,
    progressCheckIns: store.progressCheckIns.map((entry) =>
      entry.id === id ? nextEntry : entry,
    ),
  };

  await writeAppDataStore(nextStore);

  return nextEntry;
}

export async function addProgressPhoto(input: ProgressPhotoInput) {
  const store = await readAppDataStore();
  const nextPhoto: ProgressPhoto = {
    id: `photo-${crypto.randomUUID()}`,
    ...input,
  };

  const nextStore: AppData = {
    ...store,
    progressPhotos: [nextPhoto, ...store.progressPhotos],
  };

  await writeAppDataStore(nextStore);

  return nextPhoto;
}

type InventoryItemInput = Omit<InventoryItem, "id" | "status">;

function getInventoryStatus(stockUnits: number, reorderLevel: number) {
  if (stockUnits <= 0) {
    return "Out of Stock" as const;
  }

  if (stockUnits <= reorderLevel) {
    return "Low Stock" as const;
  }

  return "In Stock" as const;
}

export async function createInventoryItem(input: InventoryItemInput) {
  const store = await readAppDataStore();
  const item: InventoryItem = {
    id: `inventory-${crypto.randomUUID()}`,
    ...input,
    status: getInventoryStatus(input.stockUnits, input.reorderLevel),
  };

  const nextStore: AppData = {
    ...store,
    inventoryItems: [item, ...store.inventoryItems],
  };

  await writeAppDataStore(nextStore);

  return item;
}

type InventorySaleInput = Omit<InventorySale, "id" | "totalAmountInr">;

export async function recordInventorySale(input: InventorySaleInput) {
  const store = await readAppDataStore();
  const item = store.inventoryItems.find((entry) => entry.id === input.itemId);

  if (!item) {
    throw new Error("Inventory item not found.");
  }

  if (input.quantity <= 0) {
    throw new Error("Quantity should be greater than zero.");
  }

  if (item.stockUnits < input.quantity) {
    throw new Error("Not enough stock available.");
  }

  const nextStock = item.stockUnits - input.quantity;
  const sale: InventorySale = {
    id: `sale-${crypto.randomUUID()}`,
    ...input,
    totalAmountInr: item.sellingPriceInr * input.quantity,
  };

  const nextStore: AppData = {
    ...store,
    inventoryItems: store.inventoryItems.map((entry) =>
      entry.id === item.id
        ? {
            ...entry,
            stockUnits: nextStock,
            status: getInventoryStatus(nextStock, entry.reorderLevel),
          }
        : entry,
    ),
    inventorySales: [sale, ...store.inventorySales],
  };

  await writeAppDataStore(nextStore);

  return sale;
}

export async function restockInventoryItem(itemId: string, quantity: number) {
  const store = await readAppDataStore();
  const item = store.inventoryItems.find((entry) => entry.id === itemId);

  if (!item) {
    throw new Error("Inventory item not found.");
  }

  if (quantity <= 0) {
    throw new Error("Restock quantity should be greater than zero.");
  }

  const nextStock = item.stockUnits + quantity;
  const nextItem: InventoryItem = {
    ...item,
    stockUnits: nextStock,
    status: getInventoryStatus(nextStock, item.reorderLevel),
  };

  const nextStore: AppData = {
    ...store,
    inventoryItems: store.inventoryItems.map((entry) =>
      entry.id === itemId ? nextItem : entry,
    ),
  };

  await writeAppDataStore(nextStore);

  return nextItem;
}

export async function importInventoryItemsToAppData(items: InventoryItem[]) {
  const store = await readAppDataStore();
  const existingItems = [...store.inventoryItems];
  const imported: InventoryItem[] = [];
  const updated: InventoryItem[] = [];

  items.forEach((item) => {
    const existingIndex = existingItems.findIndex(
      (entry) =>
        entry.id === item.id ||
        (entry.sku && item.sku && entry.sku.trim().toLowerCase() === item.sku.trim().toLowerCase()),
    );

    if (existingIndex >= 0) {
      existingItems[existingIndex] = item;
      updated.push(item);
      return;
    }

    imported.push(item);
    existingItems.push(item);
  });

  const nextStore: AppData = {
    ...store,
    inventoryItems: existingItems,
  };

  await writeAppDataStore(nextStore);

  return {
    imported,
    updated,
    totalItems: nextStore.inventoryItems.length,
  };
}
