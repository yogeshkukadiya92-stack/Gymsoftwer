import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buildDefaultFormFields,
  FormsStore,
  IntakeForm,
  IntakeFormField,
  IntakeFormResponse,
  NewIntakeFormInput,
  slugifyFormTitle,
  starterForms,
  starterResponses,
} from "@/lib/forms";
import { normalizePhoneForLogin } from "@/lib/account-policy";
import { getAppData } from "@/lib/data";
import {
  createSupabaseForm,
  createSupabaseFormResponse,
  deleteSupabaseForm,
  getSupabaseFormsStore,
  updateSupabaseFormResponseOwnership,
  updateSupabaseForm,
} from "@/lib/supabase/persistence";

const dataDirectory = path.join(process.cwd(), "data");
const storePath = path.join(dataDirectory, "forms-store.json");

const initialStore: FormsStore = {
  forms: starterForms,
  responses: starterResponses,
};

async function ensureStore() {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(storePath, "utf8");
  } catch {
    await writeFile(storePath, JSON.stringify(initialStore, null, 2), "utf8");
  }
}

async function readStore(): Promise<FormsStore> {
  await ensureStore();
  const raw = await readFile(storePath, "utf8");
  return JSON.parse(raw) as FormsStore;
}

async function writeStore(store: FormsStore) {
  await ensureStore();
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

export async function getFormsStore() {
  const supabaseStore = await getSupabaseFormsStore();
  return supabaseStore ?? readStore();
}

export async function getAllForms() {
  const store = await getFormsStore();
  return store.forms;
}

export async function getAllFormResponses() {
  const store = await getFormsStore();
  return store.responses;
}

export async function getFormBySlug(slug: string) {
  const store = await getFormsStore();
  return store.forms.find((form) => form.slug === slug) ?? null;
}

export async function getFormById(formId: string) {
  const store = await getFormsStore();
  return store.forms.find((form) => form.id === formId) ?? null;
}

function sanitizeExternalFieldId(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function inferFieldTypeFromAnswer(value: string): IntakeFormField["type"] {
  const trimmed = value.trim();

  if (!trimmed) {
    return "short_text";
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "email";
  }

  if (/^[+()\d\s-]{7,}$/.test(trimmed)) {
    return "phone";
  }

  if (/^https?:\/\/.+/i.test(trimmed)) {
    return "link";
  }

  if (!Number.isNaN(Number(trimmed))) {
    return "number";
  }

  return trimmed.length > 80 ? "paragraph" : "short_text";
}

function buildExternalFieldsFromAnswers(answers: Record<string, string>) {
  return Object.entries(answers).map(([label, value], index) => ({
    id: sanitizeExternalFieldId(label) || `field_${index + 1}`,
    label,
    type: inferFieldTypeFromAnswer(value),
    required: false,
  })) satisfies IntakeFormField[];
}

export async function createOrUpdateExternalIntakeForm(input: {
  source: string;
  externalFormId?: string;
  title: string;
  description?: string;
  audience?: string;
  redirectUrl?: string;
  fields?: IntakeFormField[];
  seedAnswers?: Record<string, string>;
}) {
  const store = await getFormsStore();
  const sourceDescription = input.externalFormId
    ? `${input.source} form ${input.externalFormId}`
    : `${input.source} form`;
  const existing = store.forms.find(
    (form) =>
      form.title.trim().toLowerCase() === input.title.trim().toLowerCase() ||
      form.slug === slugifyFormTitle(input.title),
  );
  const fields =
    input.fields && input.fields.length > 0
      ? input.fields
      : input.seedAnswers && Object.keys(input.seedAnswers).length > 0
        ? buildExternalFieldsFromAnswers(input.seedAnswers)
        : buildDefaultFormFields(input.title.trim() || "External form");
  const normalizedInput: NewIntakeFormInput = {
    title: input.title.trim() || "External form",
    description:
      input.description?.trim() ||
      `Imported automatically from ${sourceDescription} submissions.`,
    audience: input.audience?.trim() || "External form submissions",
    redirectUrl: input.redirectUrl?.trim() || "",
    fields,
  };

  if (existing) {
    return updateIntakeForm(existing.id, normalizedInput);
  }

  return createIntakeForm(normalizedInput);
}

export async function createIntakeForm(input: NewIntakeFormInput) {
  const supabaseForm = await createSupabaseForm(input);

  if (supabaseForm) {
    return supabaseForm;
  }

  const store = await readStore();
  const baseSlug = slugifyFormTitle(input.title);
  const existingSlugs = new Set(store.forms.map((form) => form.slug));

  let slug = baseSlug || "untitled-form";
  let suffix = 2;

  while (existingSlugs.has(slug)) {
    slug = `${baseSlug || "untitled-form"}-${suffix}`;
    suffix += 1;
  }

  const form: IntakeForm = {
    id: `form-${crypto.randomUUID()}`,
    slug,
    title: input.title.trim(),
    description: input.description.trim() || "Collect information from clients.",
    audience: input.audience.trim() || "General clients",
    status: "Active",
    redirectUrl: input.redirectUrl?.trim() || "",
    fields:
      input.fields && input.fields.length > 0
        ? input.fields
        : buildDefaultFormFields(input.title.trim() || "Client"),
  };

  const nextStore: FormsStore = {
    ...store,
    forms: [form, ...store.forms],
  };

  await writeStore(nextStore);

  return form;
}

export async function updateIntakeForm(formId: string, input: NewIntakeFormInput) {
  const supabaseForm = await updateSupabaseForm(formId, input);

  if (supabaseForm) {
    return supabaseForm;
  }

  const store = await readStore();
  const existing = store.forms.find((form) => form.id === formId);

  if (!existing) {
    throw new Error("Form not found.");
  }

  const baseSlug = slugifyFormTitle(input.title || existing.title);
  const existingSlugs = new Set(
    store.forms.filter((form) => form.id !== formId).map((form) => form.slug),
  );

  let slug = baseSlug || existing.slug || "untitled-form";
  let suffix = 2;

  while (existingSlugs.has(slug)) {
    slug = `${baseSlug || "untitled-form"}-${suffix}`;
    suffix += 1;
  }

  const updatedForm: IntakeForm = {
    ...existing,
    slug,
    title: input.title.trim() || existing.title,
    description: input.description.trim() || existing.description,
    audience: input.audience.trim() || existing.audience,
    redirectUrl: input.redirectUrl?.trim() || existing.redirectUrl || "",
    fields:
      input.fields && input.fields.length > 0
        ? input.fields
        : existing.fields.length > 0
          ? existing.fields
          : buildDefaultFormFields(input.title.trim() || existing.title),
  };

  const nextStore: FormsStore = {
    ...store,
    forms: store.forms.map((form) => (form.id === formId ? updatedForm : form)),
  };

  await writeStore(nextStore);

  return updatedForm;
}

export async function deleteIntakeForm(formId: string) {
  const supabaseDeleted = await deleteSupabaseForm(formId);

  if (supabaseDeleted) {
    return supabaseDeleted;
  }

  const store = await readStore();
  const existing = store.forms.find((form) => form.id === formId);

  if (!existing) {
    throw new Error("Form not found.");
  }

  const nextStore: FormsStore = {
    forms: store.forms.filter((form) => form.id !== formId),
    responses: store.responses.filter((response) => response.formId !== formId),
  };

  await writeStore(nextStore);

  return { id: formId };
}

export async function createFormResponse(
  formId: string,
  answers: Record<string, string>,
  metadata?: IntakeFormResponse["metadata"],
) {
  const store = await getFormsStore();
  const form = store.forms.find((item) => item.id === formId) ?? null;
  const phoneField =
    form?.fields.find((field) => field.type === "phone") ??
    form?.fields.find((field) => /phone|mobile|whatsapp/i.test(field.label));
  const respondentPhone = phoneField ? answers[phoneField.id] ?? "" : "";
  const normalizedPhone = normalizePhoneForLogin(respondentPhone);
  const appData = await getAppData();
  const matchedProfile = normalizedPhone
    ? appData.profiles.find(
        (profile) => normalizePhoneForLogin(profile.phone) === normalizedPhone,
      )
    : undefined;
  const supabaseResponse = await createSupabaseFormResponse(formId, answers, {
    memberId: matchedProfile?.id,
    respondentPhone: respondentPhone || undefined,
  }, metadata);

  if (supabaseResponse) {
    return supabaseResponse;
  }

  const response: IntakeFormResponse = {
    id: `response-${crypto.randomUUID()}`,
    formId,
    submittedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    answers,
    memberId: matchedProfile?.id,
    respondentPhone: respondentPhone || undefined,
    metadata,
  };

  const nextStore: FormsStore = {
    ...store,
    responses: [response, ...store.responses],
  };

  await writeStore(nextStore);

  return response;
}

export async function assignFormResponseToMember(input: {
  responseId: string;
  memberId: string;
  respondentPhone?: string;
}) {
  const supabaseUpdated = await updateSupabaseFormResponseOwnership(input.responseId, {
    memberId: input.memberId,
    respondentPhone: input.respondentPhone,
  });

  if (supabaseUpdated) {
    return supabaseUpdated;
  }

  const store = await readStore();
  const existing = store.responses.find((response) => response.id === input.responseId);

  if (!existing) {
    throw new Error("Response not found.");
  }

  const nextStore: FormsStore = {
    ...store,
    responses: store.responses.map((response) =>
      response.id === input.responseId
        ? {
            ...response,
            memberId: input.memberId,
            respondentPhone: input.respondentPhone ?? response.respondentPhone,
          }
        : response,
    ),
  };

  await writeStore(nextStore);

  return {
    id: input.responseId,
    memberId: input.memberId,
    respondentPhone: input.respondentPhone,
  };
}
