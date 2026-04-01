import { createHash, randomBytes } from "node:crypto";

export const integrationDatasets = [
  "profiles",
  "memberships",
  "sessions",
  "attendance",
  "forms",
  "formResponses",
  "inventoryItems",
  "inventorySales",
  "workoutPlans",
  "workoutLogs",
  "gymBranches",
  "branchVisits",
  "leads",
  "dietPlans",
] as const;

export type IntegrationDataset = (typeof integrationDatasets)[number];

export type IntegrationApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  scopes: IntegrationDataset[];
  status: "active" | "revoked";
  createdAt: string;
  lastUsedAt: string;
};

export function createPlainApiKey() {
  return `gymflow_live_${randomBytes(24).toString("hex")}`;
}

export function hashApiKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function getKeyPrefix(value: string) {
  return value.slice(0, 14);
}

export function normalizeIntegrationScopes(input: string[] | undefined) {
  const values = (input ?? []).filter((item): item is string => Boolean(item));
  const filtered = values.filter((item): item is IntegrationDataset =>
    integrationDatasets.includes(item as IntegrationDataset),
  );

  return filtered.length > 0 ? filtered : [...integrationDatasets];
}
