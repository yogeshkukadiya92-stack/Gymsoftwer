import {
  AppData,
  InventoryItem,
  InventorySale,
  ProgressCheckIn,
  ProgressPhoto,
  Profile,
} from "@/lib/types";
import {
  FormsStore,
  IntakeForm,
  IntakeFormField,
  IntakeFormResponse,
  NewIntakeFormInput,
  buildDefaultFormFields,
  slugifyFormTitle,
} from "@/lib/forms";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function mapFormRow(row: {
  id: string;
  slug: string;
  title: string;
  description: string;
  audience: string;
  status: "Active" | "Draft";
  fields: IntakeFormField[];
}): IntakeForm {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    audience: row.audience,
    status: row.status,
    fields: row.fields ?? [],
  };
}

function mapResponseRow(row: {
  id: string;
  form_id: string;
  submitted_at: string;
  answers: Record<string, string>;
}): IntakeFormResponse {
  return {
    id: row.id,
    formId: row.form_id,
    submittedAt: row.submitted_at.replace("T", " ").slice(0, 16),
    answers: row.answers ?? {},
  };
}

export async function readSupabaseAppData(): Promise<AppData | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const [
    profiles,
    memberships,
    invoices,
    inventoryItems,
    inventorySales,
    exercises,
    workoutPlans,
    assignments,
    workoutLogs,
    progressCheckIns,
    progressPhotos,
    sessions,
    attendance,
  ] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase.from("memberships").select("*"),
    supabase.from("invoices").select("*"),
    supabase.from("inventory_items").select("*"),
    supabase.from("inventory_sales").select("*"),
    supabase.from("exercises").select("*"),
    supabase.from("workout_plans").select("*, exercises:workout_plan_exercises(*)"),
    supabase.from("member_workout_assignments").select("*"),
    supabase.from("workout_logs").select("*"),
    supabase.from("progress_check_ins").select("*"),
    supabase.from("progress_photos").select("*"),
    supabase.from("classes_or_sessions").select("*"),
    supabase.from("attendance").select("*"),
  ]);

  const results = [
    profiles,
    memberships,
    invoices,
    inventoryItems,
    inventorySales,
    exercises,
    workoutPlans,
    assignments,
    workoutLogs,
    progressCheckIns,
    progressPhotos,
    sessions,
    attendance,
  ];

  if (results.some((result) => result.error)) {
    return null;
  }

  return {
    profiles: (profiles.data ?? []) as AppData["profiles"],
    memberships: (memberships.data ?? []) as AppData["memberships"],
    invoices: (invoices.data ?? []) as AppData["invoices"],
    inventoryItems: (inventoryItems.data ?? []) as AppData["inventoryItems"],
    inventorySales: (inventorySales.data ?? []) as AppData["inventorySales"],
    exercises: (exercises.data ?? []) as AppData["exercises"],
    workoutPlans: (workoutPlans.data ?? []).map((plan) => ({
      ...plan,
      exercises: plan.exercises ?? [],
    })) as AppData["workoutPlans"],
    assignments: (assignments.data ?? []) as AppData["assignments"],
    workoutLogs: (workoutLogs.data ?? []) as AppData["workoutLogs"],
    progressCheckIns: (progressCheckIns.data ?? []) as ProgressCheckIn[],
    progressPhotos: (progressPhotos.data ?? []) as ProgressPhoto[],
    sessions: (sessions.data ?? []) as AppData["sessions"],
    attendance: (attendance.data ?? []) as AppData["attendance"],
  };
}

export async function getSupabaseFormsStore(): Promise<FormsStore | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const [formsResult, responsesResult] = await Promise.all([
    supabase.from("intake_forms").select("*").order("created_at", { ascending: false }),
    supabase
      .from("intake_form_responses")
      .select("*")
      .order("submitted_at", { ascending: false }),
  ]);

  if (formsResult.error || responsesResult.error) {
    return null;
  }

  return {
    forms: (formsResult.data ?? []).map((row) =>
      mapFormRow(
        row as {
          id: string;
          slug: string;
          title: string;
          description: string;
          audience: string;
          status: "Active" | "Draft";
          fields: IntakeFormField[];
        },
      ),
    ),
    responses: (responsesResult.data ?? []).map((row) =>
      mapResponseRow(
        row as {
          id: string;
          form_id: string;
          submitted_at: string;
          answers: Record<string, string>;
        },
      ),
    ),
  };
}

export async function createSupabaseForm(input: NewIntakeFormInput) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const existingForms = await getSupabaseFormsStore();
  const existingSlugs = new Set(existingForms?.forms.map((form) => form.slug) ?? []);
  const baseSlug = slugifyFormTitle(input.title);
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

  const { error } = await supabase.from("intake_forms").insert({
    id: form.id,
    slug: form.slug,
    title: form.title,
    description: form.description,
    audience: form.audience,
    status: form.status,
    fields: form.fields,
  });

  if (error) {
    throw new Error(error.message);
  }

  return form;
}

export async function updateSupabaseForm(formId: string, input: NewIntakeFormInput) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data: existing, error: existingError } = await supabase
    .from("intake_forms")
    .select("*")
    .eq("id", formId)
    .single();

  if (existingError || !existing) {
    throw new Error("Form not found.");
  }

  const existingForms = await getSupabaseFormsStore();
  const baseSlug = slugifyFormTitle(input.title || existing.title);
  const existingSlugs = new Set(
    (existingForms?.forms ?? [])
      .filter((form) => form.id !== formId)
      .map((form) => form.slug),
  );
  let slug = baseSlug || existing.slug || "untitled-form";
  let suffix = 2;

  while (existingSlugs.has(slug)) {
    slug = `${baseSlug || "untitled-form"}-${suffix}`;
    suffix += 1;
  }

  const updatedForm: IntakeForm = {
    id: existing.id,
    slug,
    title: input.title.trim() || existing.title,
    description: input.description.trim() || existing.description,
    audience: input.audience.trim() || existing.audience,
    status: existing.status,
    fields:
      input.fields && input.fields.length > 0
        ? input.fields
        : existing.fields.length > 0
          ? existing.fields
          : buildDefaultFormFields(input.title.trim() || existing.title),
  };

  const { error } = await supabase
    .from("intake_forms")
    .update({
      slug: updatedForm.slug,
      title: updatedForm.title,
      description: updatedForm.description,
      audience: updatedForm.audience,
      fields: updatedForm.fields,
    })
    .eq("id", formId);

  if (error) {
    throw new Error(error.message);
  }

  return updatedForm;
}

export async function createSupabaseFormResponse(
  formId: string,
  answers: Record<string, string>,
) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const response: IntakeFormResponse = {
    id: `response-${crypto.randomUUID()}`,
    formId,
    submittedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    answers,
  };

  const { error } = await supabase.from("intake_form_responses").insert({
    id: response.id,
    form_id: response.formId,
    submitted_at: response.submittedAt.replace(" ", "T"),
    answers: response.answers,
  });

  if (error) {
    throw new Error(error.message);
  }

  return response;
}

export async function upsertSupabaseProfiles(members: Profile[]) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const rows = members.map((member) => ({
    id: member.id || `member-${crypto.randomUUID()}`,
    full_name: member.fullName,
    email: member.email,
    phone: member.phone,
    role: "member",
    fitness_goal: member.fitnessGoal,
    branch: member.branch,
    joined_on: member.joinedOn || new Date().toISOString().slice(0, 10),
  }));

  const { data, error } = await supabase
    .from("profiles")
    .upsert(rows, { onConflict: "email" })
    .select("*");

  if (error) {
    throw new Error(error.message);
  }

  return {
    imported: data ?? [],
    updated: [],
  };
}

export async function insertSupabaseProgressCheckIn(input: Omit<ProgressCheckIn, "id">) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const entry: ProgressCheckIn = { id: `progress-${crypto.randomUUID()}`, ...input };
  const { error } = await supabase.from("progress_check_ins").insert({
    id: entry.id,
    member_id: entry.memberId,
    recorded_on: entry.recordedOn,
    weight_kg: entry.weightKg,
    waist_cm: entry.waistCm,
    hips_cm: entry.hipsCm,
    chest_cm: entry.chestCm,
    thigh_cm: entry.thighCm,
    coach_note: entry.coachNote,
    energy_level: entry.energyLevel,
  });
  if (error) {
    throw new Error(error.message);
  }
  return entry;
}

export async function updateSupabaseProgressCheckIn(
  id: string,
  input: Omit<ProgressCheckIn, "id">,
) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const entry: ProgressCheckIn = { id, ...input };
  const { error } = await supabase
    .from("progress_check_ins")
    .update({
      member_id: entry.memberId,
      recorded_on: entry.recordedOn,
      weight_kg: entry.weightKg,
      waist_cm: entry.waistCm,
      hips_cm: entry.hipsCm,
      chest_cm: entry.chestCm,
      thigh_cm: entry.thighCm,
      coach_note: entry.coachNote,
      energy_level: entry.energyLevel,
    })
    .eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
  return entry;
}

export async function insertSupabaseProgressPhoto(input: Omit<ProgressPhoto, "id">) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }
  const photo: ProgressPhoto = { id: `photo-${crypto.randomUUID()}`, ...input };
  const { error } = await supabase.from("progress_photos").insert({
    id: photo.id,
    member_id: photo.memberId,
    recorded_on: photo.recordedOn,
    label: photo.label,
    image_url: photo.imageUrl,
    note: photo.note,
  });
  if (error) {
    throw new Error(error.message);
  }
  return photo;
}

export async function insertSupabaseInventoryItem(
  input: Omit<InventoryItem, "id" | "status">,
) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }
  const status =
    input.stockUnits <= 0
      ? "Out of Stock"
      : input.stockUnits <= input.reorderLevel
        ? "Low Stock"
        : "In Stock";
  const item: InventoryItem = { id: `inventory-${crypto.randomUUID()}`, ...input, status };
  const { error } = await supabase.from("inventory_items").insert({
    id: item.id,
    name: item.name,
    category: item.category,
    supplement_type: item.supplementType,
    brand: item.brand,
    flavor: item.flavor,
    supplier_name: item.supplierName,
    sku: item.sku,
    batch_code: item.batchCode,
    unit_size: item.unitSize,
    expiry_date: item.expiryDate || null,
    stock_units: item.stockUnits,
    reorder_level: item.reorderLevel,
    cost_price_inr: item.costPriceInr,
    selling_price_inr: item.sellingPriceInr,
    status: item.status,
  });
  if (error) {
    throw new Error(error.message);
  }
  return item;
}

export async function restockSupabaseInventoryItem(itemId: string, quantity: number) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }
  const { data: existing, error: existingError } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("id", itemId)
    .single();
  if (existingError || !existing) {
    throw new Error("Inventory item not found.");
  }
  const nextStock = existing.stock_units + quantity;
  const nextStatus =
    nextStock <= 0 ? "Out of Stock" : nextStock <= existing.reorder_level ? "Low Stock" : "In Stock";
  const { error } = await supabase
    .from("inventory_items")
    .update({ stock_units: nextStock, status: nextStatus })
    .eq("id", itemId);
  if (error) {
    throw new Error(error.message);
  }
  return {
    id: existing.id,
    name: existing.name,
    category: existing.category,
    supplementType: existing.supplement_type ?? "",
    brand: existing.brand,
    flavor: existing.flavor ?? "",
    supplierName: existing.supplier_name ?? "",
    sku: existing.sku,
    batchCode: existing.batch_code ?? "",
    unitSize: existing.unit_size,
    expiryDate: existing.expiry_date ?? "",
    stockUnits: nextStock,
    reorderLevel: existing.reorder_level,
    costPriceInr: existing.cost_price_inr,
    sellingPriceInr: existing.selling_price_inr,
    status: nextStatus,
  } as InventoryItem;
}

export async function recordSupabaseInventorySale(
  input: Omit<InventorySale, "id" | "totalAmountInr">,
) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data: item, error: itemError } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("id", input.itemId)
    .single();
  if (itemError || !item) {
    throw new Error("Inventory item not found.");
  }
  if (item.stock_units < input.quantity) {
    throw new Error("Not enough stock available.");
  }

  const sale: InventorySale = {
    id: `sale-${crypto.randomUUID()}`,
    ...input,
    totalAmountInr: item.selling_price_inr * input.quantity,
  };
  const nextStock = item.stock_units - input.quantity;
  const nextStatus =
    nextStock <= 0 ? "Out of Stock" : nextStock <= item.reorder_level ? "Low Stock" : "In Stock";

  const [{ error: saleError }, { error: stockError }] = await Promise.all([
    supabase.from("inventory_sales").insert({
      id: sale.id,
      item_id: sale.itemId,
      sold_on: sale.soldOn,
      quantity: sale.quantity,
      total_amount_inr: sale.totalAmountInr,
      customer_name: sale.customerName,
      payment_method: sale.paymentMethod,
    }),
    supabase
      .from("inventory_items")
      .update({ stock_units: nextStock, status: nextStatus })
      .eq("id", input.itemId),
  ]);
  if (saleError || stockError) {
    throw new Error(saleError?.message || stockError?.message || "Sale save failed.");
  }
  return sale;
}

export async function upsertSupabaseInventoryItems(items: InventoryItem[]) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }
  const rows = items.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    supplement_type: item.supplementType,
    brand: item.brand,
    flavor: item.flavor,
    supplier_name: item.supplierName,
    sku: item.sku,
    batch_code: item.batchCode,
    unit_size: item.unitSize,
    expiry_date: item.expiryDate || null,
    stock_units: item.stockUnits,
    reorder_level: item.reorderLevel,
    cost_price_inr: item.costPriceInr,
    selling_price_inr: item.sellingPriceInr,
    status: item.status,
  }));
  const { data, error } = await supabase
    .from("inventory_items")
    .upsert(rows, { onConflict: "sku" })
    .select("*");
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}
