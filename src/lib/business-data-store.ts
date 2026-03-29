import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  DietPlanRecord,
  LeadRecord,
  LeadSource,
  LeadStatus,
  starterDietPlans,
  starterLeads,
} from "@/lib/business-data";

type BusinessStore = {
  leads: LeadRecord[];
  dietPlans: DietPlanRecord[];
};

const dataDirectory = path.join(process.cwd(), "data");
const storePath = path.join(dataDirectory, "business-store.json");

const initialStore: BusinessStore = {
  leads: starterLeads,
  dietPlans: starterDietPlans,
};

async function ensureStore() {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(storePath, "utf8");
  } catch {
    await writeFile(storePath, JSON.stringify(initialStore, null, 2), "utf8");
  }
}

async function readStore(): Promise<BusinessStore> {
  await ensureStore();
  const raw = await readFile(storePath, "utf8");
  return JSON.parse(raw) as BusinessStore;
}

async function writeStore(store: BusinessStore) {
  await ensureStore();
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

export async function getBusinessStore() {
  return readStore();
}

export async function getLeadRecords() {
  const store = await readStore();
  return store.leads;
}

export async function getDietPlans() {
  const store = await readStore();
  return store.dietPlans;
}

export async function createLeadRecord(input: {
  fullName: string;
  phone: string;
  goal: string;
  source: LeadSource;
  status: LeadStatus;
  assignedTo: string;
  nextFollowUp: string;
  note: string;
}) {
  const store = await readStore();
  const lead: LeadRecord = {
    id: `lead-${crypto.randomUUID()}`,
    ...input,
  };

  const nextStore: BusinessStore = {
    ...store,
    leads: [lead, ...store.leads],
  };

  await writeStore(nextStore);
  return lead;
}

export async function updateLeadRecord(
  id: string,
  input: {
    fullName: string;
    phone: string;
    goal: string;
    source: LeadSource;
    status: LeadStatus;
    assignedTo: string;
    nextFollowUp: string;
    note: string;
  },
) {
  const store = await readStore();
  const existing = store.leads.find((lead) => lead.id === id);

  if (!existing) {
    throw new Error("Lead not found.");
  }

  const updatedLead: LeadRecord = {
    ...existing,
    ...input,
    id,
  };

  const nextStore: BusinessStore = {
    ...store,
    leads: store.leads.map((lead) => (lead.id === id ? updatedLead : lead)),
  };

  await writeStore(nextStore);
  return updatedLead;
}

export async function deleteLeadRecord(id: string) {
  const store = await readStore();
  const nextStore: BusinessStore = {
    ...store,
    leads: store.leads.filter((lead) => lead.id !== id),
  };

  await writeStore(nextStore);
  return { id };
}

export async function createDietPlan(input: Omit<DietPlanRecord, "id">) {
  const store = await readStore();
  const plan: DietPlanRecord = {
    id: `diet-${crypto.randomUUID()}`,
    ...input,
  };

  const nextStore: BusinessStore = {
    ...store,
    dietPlans: [plan, ...store.dietPlans],
  };

  await writeStore(nextStore);
  return plan;
}

export async function updateDietPlan(id: string, input: Omit<DietPlanRecord, "id">) {
  const store = await readStore();
  const existing = store.dietPlans.find((plan) => plan.id === id);

  if (!existing) {
    throw new Error("Diet plan not found.");
  }

  const updatedPlan: DietPlanRecord = {
    ...existing,
    ...input,
    id,
  };

  const nextStore: BusinessStore = {
    ...store,
    dietPlans: store.dietPlans.map((plan) => (plan.id === id ? updatedPlan : plan)),
  };

  await writeStore(nextStore);
  return updatedPlan;
}

export async function deleteDietPlan(id: string) {
  const store = await readStore();
  const nextStore: BusinessStore = {
    ...store,
    dietPlans: store.dietPlans.filter((plan) => plan.id !== id),
  };

  await writeStore(nextStore);
  return { id };
}
