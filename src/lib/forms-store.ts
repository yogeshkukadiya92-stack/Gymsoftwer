import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buildDefaultFormFields,
  FormsStore,
  IntakeForm,
  IntakeFormResponse,
  NewIntakeFormInput,
  slugifyFormTitle,
  starterForms,
  starterResponses,
} from "@/lib/forms";

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
  return readStore();
}

export async function getAllForms() {
  const store = await readStore();
  return store.forms;
}

export async function getAllFormResponses() {
  const store = await readStore();
  return store.responses;
}

export async function getFormBySlug(slug: string) {
  const store = await readStore();
  return store.forms.find((form) => form.slug === slug) ?? null;
}

export async function createIntakeForm(input: NewIntakeFormInput) {
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

export async function createFormResponse(
  formId: string,
  answers: Record<string, string>,
) {
  const store = await readStore();

  const response: IntakeFormResponse = {
    id: `response-${crypto.randomUUID()}`,
    formId,
    submittedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    answers,
  };

  const nextStore: FormsStore = {
    ...store,
    responses: [response, ...store.responses],
  };

  await writeStore(nextStore);

  return response;
}
