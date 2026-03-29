import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  CustomWhatsAppCampaign,
  DietPlanRecord,
  LeadRecord,
  LeadSource,
  LeadStatus,
  TrainerClientNote,
  starterCustomCampaigns,
  starterDietPlans,
  starterLeads,
  starterTrainerNotes,
} from "@/lib/business-data";
import {
  createSupabaseCustomCampaign,
  createSupabaseDietPlan,
  createSupabaseLead,
  createSupabaseTrainerNote,
  deleteSupabaseCustomCampaign,
  deleteSupabaseDietPlan,
  deleteSupabaseLead,
  deleteSupabaseTrainerNote,
  getSupabaseBusinessStore,
  upsertSupabaseLeads,
  updateSupabaseCustomCampaign,
  updateSupabaseDietPlan,
  updateSupabaseLead,
  updateSupabaseTrainerNote,
} from "@/lib/supabase/persistence";

type BusinessStore = {
  leads: LeadRecord[];
  dietPlans: DietPlanRecord[];
  customCampaigns: CustomWhatsAppCampaign[];
  trainerNotes: TrainerClientNote[];
};

const dataDirectory = path.join(process.cwd(), "data");
const storePath = path.join(dataDirectory, "business-store.json");

const initialStore: BusinessStore = {
  leads: starterLeads,
  dietPlans: starterDietPlans,
  customCampaigns: starterCustomCampaigns,
  trainerNotes: starterTrainerNotes,
};

function normalizeStore(store: Partial<BusinessStore>): BusinessStore {
  return {
    leads: store.leads ?? starterLeads,
    dietPlans: store.dietPlans ?? starterDietPlans,
    customCampaigns: store.customCampaigns ?? starterCustomCampaigns,
    trainerNotes: store.trainerNotes ?? starterTrainerNotes,
  };
}

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
  return normalizeStore(JSON.parse(raw) as Partial<BusinessStore>);
}

async function writeStore(store: BusinessStore) {
  await ensureStore();
  await writeFile(storePath, JSON.stringify(normalizeStore(store), null, 2), "utf8");
}

export async function getBusinessStore() {
  const supabaseStore = await getSupabaseBusinessStore();
  return supabaseStore ?? readStore();
}

export async function getLeadRecords() {
  const store = await getBusinessStore();
  return store.leads;
}

export async function getDietPlans() {
  const store = await getBusinessStore();
  return store.dietPlans;
}

export async function getCustomCampaigns() {
  const store = await getBusinessStore();
  return store.customCampaigns;
}

export async function getTrainerNotes() {
  const store = await getBusinessStore();
  return store.trainerNotes;
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
  const supabaseLead = await createSupabaseLead(input);
  if (supabaseLead) {
    return supabaseLead;
  }

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
  const supabaseLead = await updateSupabaseLead(id, input);
  if (supabaseLead) {
    return supabaseLead;
  }

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
  const supabaseResult = await deleteSupabaseLead(id);
  if (supabaseResult) {
    return supabaseResult;
  }

  const store = await readStore();
  const nextStore: BusinessStore = {
    ...store,
    leads: store.leads.filter((lead) => lead.id !== id),
  };

  await writeStore(nextStore);
  return { id };
}

export async function importLeadRecords(leads: LeadRecord[]) {
  const normalizedLeads = leads.map((lead) => ({
    ...lead,
    id: lead.id || `lead-${crypto.randomUUID()}`,
    nextFollowUp: lead.nextFollowUp || new Date().toISOString().slice(0, 10),
  }));

  const supabaseStore = await getSupabaseBusinessStore();
  if (supabaseStore) {
    const existingById = new Map(supabaseStore.leads.map((lead) => [lead.id, lead]));
    const existingByPhone = new Map(
      supabaseStore.leads.map((lead) => [lead.phone.toLowerCase(), lead]),
    );
    const mergedMap = new Map(supabaseStore.leads.map((lead) => [lead.id, lead]));
    const imported: LeadRecord[] = [];
    const updated: LeadRecord[] = [];

    normalizedLeads.forEach((lead) => {
      const existing = existingById.get(lead.id) ?? existingByPhone.get(lead.phone.toLowerCase());

      if (existing) {
        const nextLead: LeadRecord = {
          ...existing,
          ...lead,
          id: existing.id,
        };
        mergedMap.set(existing.id, nextLead);
        updated.push(nextLead);
        return;
      }

      mergedMap.set(lead.id, lead);
      imported.push(lead);
    });

    const supabaseLeads = await upsertSupabaseLeads(Array.from(mergedMap.values()));

    if (!supabaseLeads) {
      throw new Error("Lead import failed.");
    }

    return {
      leads: supabaseLeads,
      imported: imported.map((lead) => supabaseLeads.find((item) => item.id === lead.id) ?? lead),
      updated: updated.map((lead) => supabaseLeads.find((item) => item.id === lead.id) ?? lead),
      totalLeads: supabaseLeads.length,
    };
  }

  const store = await readStore();
  const existingById = new Map(store.leads.map((lead) => [lead.id, lead]));
  const existingByPhone = new Map(store.leads.map((lead) => [lead.phone.toLowerCase(), lead]));
  const imported: LeadRecord[] = [];
  const updated: LeadRecord[] = [];

  const mergedMap = new Map(store.leads.map((lead) => [lead.id, lead]));

  normalizedLeads.forEach((lead) => {
    const existing = existingById.get(lead.id) ?? existingByPhone.get(lead.phone.toLowerCase());

    if (existing) {
      const nextLead: LeadRecord = {
        ...existing,
        ...lead,
        id: existing.id,
      };
      mergedMap.set(existing.id, nextLead);
      updated.push(nextLead);
      return;
    }

    mergedMap.set(lead.id, lead);
    imported.push(lead);
  });

  const nextStore: BusinessStore = {
    ...store,
    leads: Array.from(mergedMap.values()),
  };

  await writeStore(nextStore);

  return {
    leads: nextStore.leads,
    imported,
    updated,
    totalLeads: nextStore.leads.length,
  };
}

export async function createDietPlan(input: Omit<DietPlanRecord, "id">) {
  const supabasePlan = await createSupabaseDietPlan(input);
  if (supabasePlan) {
    return supabasePlan;
  }

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
  const supabasePlan = await updateSupabaseDietPlan(id, input);
  if (supabasePlan) {
    return supabasePlan;
  }

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
  const supabaseResult = await deleteSupabaseDietPlan(id);
  if (supabaseResult) {
    return supabaseResult;
  }

  const store = await readStore();
  const nextStore: BusinessStore = {
    ...store,
    dietPlans: store.dietPlans.filter((plan) => plan.id !== id),
  };

  await writeStore(nextStore);
  return { id };
}

export async function createCustomCampaign(input: Omit<CustomWhatsAppCampaign, "id" | "category">) {
  const supabaseCampaign = await createSupabaseCustomCampaign(input);
  if (supabaseCampaign) {
    return supabaseCampaign;
  }

  const store = await readStore();
  const campaign: CustomWhatsAppCampaign = {
    id: `campaign-${crypto.randomUUID()}`,
    category: "Custom",
    ...input,
  };

  const nextStore: BusinessStore = {
    ...store,
    customCampaigns: [campaign, ...store.customCampaigns],
  };

  await writeStore(nextStore);
  return campaign;
}

export async function updateCustomCampaign(
  id: string,
  input: Omit<CustomWhatsAppCampaign, "id" | "category">,
) {
  const supabaseCampaign = await updateSupabaseCustomCampaign(id, input);
  if (supabaseCampaign) {
    return supabaseCampaign;
  }

  const store = await readStore();
  const existing = store.customCampaigns.find((campaign) => campaign.id === id);

  if (!existing) {
    throw new Error("Campaign not found.");
  }

  const updatedCampaign: CustomWhatsAppCampaign = {
    ...existing,
    ...input,
    id,
    category: "Custom",
  };

  const nextStore: BusinessStore = {
    ...store,
    customCampaigns: store.customCampaigns.map((campaign) =>
      campaign.id === id ? updatedCampaign : campaign,
    ),
  };

  await writeStore(nextStore);
  return updatedCampaign;
}

export async function deleteCustomCampaign(id: string) {
  const supabaseResult = await deleteSupabaseCustomCampaign(id);
  if (supabaseResult) {
    return supabaseResult;
  }

  const store = await readStore();
  const nextStore: BusinessStore = {
    ...store,
    customCampaigns: store.customCampaigns.filter((campaign) => campaign.id !== id),
  };

  await writeStore(nextStore);
  return { id };
}

export async function createTrainerNote(input: Omit<TrainerClientNote, "id">) {
  const supabaseNote = await createSupabaseTrainerNote(input);
  if (supabaseNote) {
    return supabaseNote;
  }

  const store = await readStore();
  const note: TrainerClientNote = {
    id: `trainer-note-${crypto.randomUUID()}`,
    ...input,
  };

  const nextStore: BusinessStore = {
    ...store,
    trainerNotes: [note, ...store.trainerNotes],
  };

  await writeStore(nextStore);
  return note;
}

export async function updateTrainerNote(id: string, input: Omit<TrainerClientNote, "id">) {
  const supabaseNote = await updateSupabaseTrainerNote(id, input);
  if (supabaseNote) {
    return supabaseNote;
  }

  const store = await readStore();
  const existing = store.trainerNotes.find((note) => note.id === id);

  if (!existing) {
    throw new Error("Trainer note not found.");
  }

  const updatedNote: TrainerClientNote = {
    ...existing,
    ...input,
    id,
  };

  const nextStore: BusinessStore = {
    ...store,
    trainerNotes: store.trainerNotes.map((note) => (note.id === id ? updatedNote : note)),
  };

  await writeStore(nextStore);
  return updatedNote;
}

export async function deleteTrainerNote(id: string) {
  const supabaseResult = await deleteSupabaseTrainerNote(id);
  if (supabaseResult) {
    return supabaseResult;
  }

  const store = await readStore();
  const nextStore: BusinessStore = {
    ...store,
    trainerNotes: store.trainerNotes.filter((note) => note.id !== id),
  };

  await writeStore(nextStore);
  return { id };
}
