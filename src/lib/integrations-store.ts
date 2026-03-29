import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  createPlainApiKey,
  getKeyPrefix,
  hashApiKey,
  IntegrationApiKey,
  normalizeIntegrationScopes,
} from "@/lib/integrations";
import {
  createSupabaseIntegrationApiKey,
  getSupabaseIntegrationApiKeys,
  revokeSupabaseIntegrationApiKey,
  touchSupabaseIntegrationApiKey,
} from "@/lib/supabase/persistence";

type IntegrationStore = {
  keys: IntegrationApiKey[];
};

const dataDirectory = path.join(process.cwd(), "data");
const storePath = path.join(dataDirectory, "integrations-store.json");

const initialStore: IntegrationStore = {
  keys: [],
};

async function ensureStore() {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(storePath, "utf8");
  } catch {
    await writeFile(storePath, JSON.stringify(initialStore, null, 2), "utf8");
  }
}

async function readStore() {
  await ensureStore();
  const raw = await readFile(storePath, "utf8");
  return JSON.parse(raw) as IntegrationStore;
}

async function writeStore(store: IntegrationStore) {
  await ensureStore();
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

export async function getIntegrationApiKeys() {
  const supabaseKeys = await getSupabaseIntegrationApiKeys();
  return supabaseKeys ?? (await readStore()).keys;
}

export async function createIntegrationApiKey(input: {
  name: string;
  scopes?: string[];
}) {
  const plainKey = createPlainApiKey();
  const key: IntegrationApiKey = {
    id: `api-key-${crypto.randomUUID()}`,
    name: input.name.trim(),
    keyPrefix: getKeyPrefix(plainKey),
    keyHash: hashApiKey(plainKey),
    scopes: normalizeIntegrationScopes(input.scopes),
    status: "active",
    createdAt: new Date().toISOString(),
    lastUsedAt: "",
  };

  try {
    const supabaseKey = await createSupabaseIntegrationApiKey(key);
    if (supabaseKey) {
      return {
        key: supabaseKey,
        plainKey,
      };
    }
  } catch {
    // Fall back to local file storage if integration key table is not ready.
  }

  const store = await readStore();
  await writeStore({
    keys: [key, ...store.keys],
  });

  return {
    key,
    plainKey,
  };
}

export async function revokeIntegrationApiKey(id: string) {
  try {
    const supabaseKey = await revokeSupabaseIntegrationApiKey(id);
    if (supabaseKey) {
      return supabaseKey;
    }
  } catch {
    // Fall back to local file storage if integration key table is not ready.
  }

  const store = await readStore();
  const updatedKey = store.keys.find((item) => item.id === id);

  if (!updatedKey) {
    throw new Error("API key not found.");
  }

  updatedKey.status = "revoked";
  await writeStore({
    keys: store.keys.map((item) => (item.id === id ? updatedKey : item)),
  });

  return updatedKey;
}

export async function validateIntegrationApiKey(rawKey: string) {
  const keys = await getIntegrationApiKeys();
  const keyHash = hashApiKey(rawKey);
  const key = keys.find((item) => item.keyHash === keyHash && item.status === "active");

  if (!key) {
    return null;
  }

  try {
    await touchSupabaseIntegrationApiKey(key.id);
  } catch {
    const store = await readStore();
    await writeStore({
      keys: store.keys.map((item) =>
        item.id === key.id ? { ...item, lastUsedAt: new Date().toISOString() } : item,
      ),
    });
  }

  return {
    ...key,
    lastUsedAt: new Date().toISOString(),
  };
}
