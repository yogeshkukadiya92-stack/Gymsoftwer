import {
  AppData,
  Attendance,
  BranchVisit,
  ClassSession,
  GymBranch,
  InventoryItem,
  InventorySale,
  ProgressCheckIn,
  ProgressPhoto,
  Profile,
  UserPermission,
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
import {
  CustomWhatsAppCampaign,
  DietPlanRecord,
  LeadRecord,
  TrainerClientNote,
} from "@/lib/business-data";
import { IntegrationApiKey } from "@/lib/integrations";
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

function mapProfileRow(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id ?? ""),
    fullName: String(row.full_name ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    role: (row.role ?? "member") as Profile["role"],
    fitnessGoal: String(row.fitness_goal ?? ""),
    branch: String(row.branch ?? ""),
    joinedOn: String(row.joined_on ?? ""),
  };
}

function mapUserPermissionRow(row: Record<string, unknown>): UserPermission {
  return {
    userId: String(row.user_id ?? ""),
    accessLabel: String(row.access_label ?? ""),
    allowedRoutes: Array.isArray(row.allowed_routes)
      ? row.allowed_routes.map((item) => String(item))
      : [],
  };
}

function mapMembershipRow(row: Record<string, unknown>): AppData["memberships"][number] {
  return {
    id: String(row.id ?? ""),
    memberId: String(row.member_id ?? ""),
    planName: String(row.plan_name ?? ""),
    status: (row.status ?? "Active") as AppData["memberships"][number]["status"],
    startDate: String(row.start_date ?? ""),
    renewalDate: String(row.renewal_date ?? ""),
    billingCycle: (row.billing_cycle ?? "Monthly") as AppData["memberships"][number]["billingCycle"],
    amountInr: Number(row.amount_inr ?? 0),
    paymentStatus: (row.payment_status ?? "Pending") as AppData["memberships"][number]["paymentStatus"],
    lastPaymentDate: String(row.last_payment_date ?? ""),
    nextInvoiceDate: String(row.next_invoice_date ?? ""),
    paymentMethod: (row.payment_method ?? "Cash") as AppData["memberships"][number]["paymentMethod"],
    outstandingAmountInr: Number(row.outstanding_amount_inr ?? 0),
  };
}

function mapInvoiceRow(row: Record<string, unknown>): AppData["invoices"][number] {
  return {
    id: String(row.id ?? ""),
    membershipId: String(row.membership_id ?? ""),
    memberId: String(row.member_id ?? ""),
    invoiceNumber: String(row.invoice_number ?? ""),
    issuedOn: String(row.issued_on ?? ""),
    dueOn: String(row.due_on ?? ""),
    amountInr: Number(row.amount_inr ?? 0),
    status: (row.status ?? "Pending") as AppData["invoices"][number]["status"],
    paidOn: row.paid_on ? String(row.paid_on) : undefined,
    paymentMethod: row.payment_method
      ? (row.payment_method as AppData["invoices"][number]["paymentMethod"])
      : undefined,
  };
}

function mapInventoryItemRow(row: Record<string, unknown>): InventoryItem {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    category: String(row.category ?? "Supplement"),
    supplementType: String(row.supplement_type ?? ""),
    brand: String(row.brand ?? ""),
    flavor: String(row.flavor ?? ""),
    supplierName: String(row.supplier_name ?? ""),
    sku: String(row.sku ?? ""),
    batchCode: String(row.batch_code ?? ""),
    unitSize: String(row.unit_size ?? ""),
    expiryDate: String(row.expiry_date ?? ""),
    stockUnits: Number(row.stock_units ?? 0),
    reorderLevel: Number(row.reorder_level ?? 0),
    costPriceInr: Number(row.cost_price_inr ?? 0),
    sellingPriceInr: Number(row.selling_price_inr ?? 0),
    status: (row.status ?? "In Stock") as InventoryItem["status"],
  };
}

function mapInventorySaleRow(row: Record<string, unknown>): InventorySale {
  return {
    id: String(row.id ?? ""),
    itemId: String(row.item_id ?? ""),
    soldOn: String(row.sold_on ?? ""),
    quantity: Number(row.quantity ?? 0),
    totalAmountInr: Number(row.total_amount_inr ?? 0),
    customerName: String(row.customer_name ?? ""),
    paymentMethod: (row.payment_method ?? "Cash") as InventorySale["paymentMethod"],
  };
}

function mapProgressCheckInRow(row: Record<string, unknown>): ProgressCheckIn {
  return {
    id: String(row.id ?? ""),
    memberId: String(row.member_id ?? ""),
    recordedOn: String(row.recorded_on ?? ""),
    weightKg: Number(row.weight_kg ?? 0),
    waistCm: Number(row.waist_cm ?? 0),
    hipsCm: Number(row.hips_cm ?? 0),
    chestCm: Number(row.chest_cm ?? 0),
    thighCm: Number(row.thigh_cm ?? 0),
    coachNote: String(row.coach_note ?? ""),
    energyLevel: (row.energy_level ?? "Medium") as ProgressCheckIn["energyLevel"],
  };
}

function mapProgressPhotoRow(row: Record<string, unknown>): ProgressPhoto {
  return {
    id: String(row.id ?? ""),
    memberId: String(row.member_id ?? ""),
    recordedOn: String(row.recorded_on ?? ""),
    label: String(row.label ?? ""),
    imageUrl: String(row.image_url ?? ""),
    note: String(row.note ?? ""),
  };
}

function mapExerciseRow(row: Record<string, unknown>): AppData["exercises"][number] {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    category: String(row.category ?? ""),
    difficulty: (row.difficulty ?? "Beginner") as AppData["exercises"][number]["difficulty"],
    primaryMuscle: String(row.primary_muscle ?? ""),
    equipment: String(row.equipment ?? ""),
    mediaType: (row.media_type ?? "image") as AppData["exercises"][number]["mediaType"],
    mediaUrl: String(row.media_url ?? ""),
    cues: Array.isArray(row.cues) ? row.cues.map((item) => String(item)) : [],
  };
}

function mapWorkoutPlanRow(row: Record<string, unknown>): AppData["workoutPlans"][number] {
  const exercises = Array.isArray(row.exercises) ? row.exercises : [];

  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    goal: String(row.goal ?? ""),
    coach: String(row.coach ?? ""),
    split: String(row.split ?? ""),
    durationWeeks: Number(row.duration_weeks ?? 0),
    exercises: exercises.map((item) => ({
      id: String(item.id ?? ""),
      exerciseId: String(item.exercise_id ?? item.exerciseId ?? ""),
      sets: Number(item.sets ?? 0),
      reps: String(item.reps ?? ""),
      restSeconds: Number(item.rest_seconds ?? item.restSeconds ?? 0),
      notes: String(item.notes ?? ""),
    })),
  };
}

function mapAssignmentRow(row: Record<string, unknown>): AppData["assignments"][number] {
  return {
    id: String(row.id ?? ""),
    planId: String(row.plan_id ?? ""),
    memberId: String(row.member_id ?? ""),
    startDate: String(row.start_date ?? ""),
    status: (row.status ?? "Active") as AppData["assignments"][number]["status"],
  };
}

function mapWorkoutLogRow(row: Record<string, unknown>): AppData["workoutLogs"][number] {
  return {
    id: String(row.id ?? ""),
    memberId: String(row.member_id ?? ""),
    exerciseId: String(row.exercise_id ?? ""),
    date: String(row.date ?? ""),
    setsCompleted: Number(row.sets_completed ?? 0),
    repsCompleted: String(row.reps_completed ?? ""),
    weightKg: Number(row.weight_kg ?? 0),
    notes: String(row.notes ?? ""),
  };
}

function mapSessionRow(row: Record<string, unknown>): AppData["sessions"][number] {
  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? ""),
    coach: String(row.coach ?? ""),
    day: String(row.day ?? ""),
    time: String(row.time ?? ""),
    capacity: Number(row.capacity ?? 0),
    room: String(row.room ?? ""),
    branchId: String(row.branch_id ?? ""),
    zoomLink: String(row.zoom_link ?? ""),
  };
}

function mapAttendanceRow(row: Record<string, unknown>): AppData["attendance"][number] {
  return {
    id: String(row.id ?? ""),
    sessionId: String(row.session_id ?? ""),
    memberId: String(row.member_id ?? ""),
    status: (row.status ?? "Booked") as AppData["attendance"][number]["status"],
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

function mapLeadRow(row: Record<string, unknown>): LeadRecord {
  return {
    id: String(row.id ?? ""),
    fullName: String(row.full_name ?? ""),
    phone: String(row.phone ?? ""),
    goal: String(row.goal ?? ""),
    source: String(row.source ?? "Website") as LeadRecord["source"],
    status: String(row.status ?? "New") as LeadRecord["status"],
    assignedTo: String(row.assigned_to ?? ""),
    nextFollowUp: String(row.next_follow_up ?? ""),
    note: String(row.note ?? ""),
  };
}

function mapGymBranchRow(row: Record<string, unknown>): GymBranch {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    city: String(row.city ?? ""),
    address: String(row.address ?? ""),
    managerName: String(row.manager_name ?? ""),
    phone: String(row.phone ?? ""),
    kind: (row.kind ?? "Physical") as GymBranch["kind"],
  };
}

function mapIntegrationApiKeyRow(row: Record<string, unknown>): IntegrationApiKey {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    keyPrefix: String(row.key_prefix ?? ""),
    keyHash: String(row.key_hash ?? ""),
    scopes: Array.isArray(row.scopes) ? row.scopes.map((item) => String(item)) as IntegrationApiKey["scopes"] : [],
    status: (row.status ?? "active") as IntegrationApiKey["status"],
    createdAt: String(row.created_at ?? ""),
    lastUsedAt: String(row.last_used_at ?? ""),
  };
}

function mapDietPlanRow(row: Record<string, unknown>): DietPlanRecord {
  const meals = Array.isArray(row.meals) ? row.meals : [];

  return {
    id: String(row.id ?? ""),
    memberName: String(row.member_name ?? ""),
    coach: String(row.coach ?? ""),
    goal: String(row.goal ?? ""),
    calories: Number(row.calories ?? 0),
    proteinGrams: Number(row.protein_grams ?? 0),
    meals: meals.map((meal) => ({
      title: String(meal.title ?? ""),
      items: Array.isArray(meal.items) ? meal.items.map((item: unknown) => String(item)) : [],
    })),
    adherence: Number(row.adherence ?? 0),
    updatedOn: String(row.updated_on ?? ""),
  };
}

function mapCustomCampaignRow(row: Record<string, unknown>): CustomWhatsAppCampaign {
  const recipients = Array.isArray(row.recipients) ? row.recipients : [];

  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? ""),
    category: "Custom",
    scheduledFor: String(row.scheduled_for ?? ""),
    message: String(row.message ?? ""),
    recipients: recipients.map((recipient) => ({
      id: String(recipient.id ?? ""),
      name: String(recipient.name ?? ""),
      phone: String(recipient.phone ?? ""),
      note: String(recipient.note ?? ""),
    })),
  };
}

function mapTrainerNoteRow(row: Record<string, unknown>): TrainerClientNote {
  return {
    id: String(row.id ?? ""),
    memberId: String(row.member_id ?? ""),
    memberName: String(row.member_name ?? ""),
    trainerName: String(row.trainer_name ?? ""),
    note: String(row.note ?? ""),
    focusArea: String(row.focus_area ?? ""),
    updatedOn: String(row.updated_on ?? ""),
  };
}

export async function readSupabaseAppData(): Promise<AppData | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const [
    profiles,
    userPermissions,
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
    supabase.from("user_permissions").select("*"),
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

  const branchesResult = await supabase.from("gym_branches").select("*");

  const mappedProfiles = (profiles.data ?? []).map((row) => mapProfileRow(row as Record<string, unknown>));
  const mappedSessions = (sessions.data ?? []).map((row) => mapSessionRow(row as Record<string, unknown>));
  const derivedBranches = Array.from(
    new Set(mappedProfiles.map((profile) => profile.branch).filter(Boolean)),
  ).map(
    (name) =>
      ({
        id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        name,
        city: "",
        address: "",
        managerName: "",
        phone: "",
        kind: "Physical",
      }) satisfies GymBranch,
  );
  const mappedBranchRows = branchesResult.error
    ? []
    : (branchesResult.data ?? []).map((row) => mapGymBranchRow(row as Record<string, unknown>));
  const branchMap = new Map<string, GymBranch>();

  [...mappedBranchRows, ...derivedBranches].forEach((branch) => {
    if (!branchMap.has(branch.id)) {
      branchMap.set(branch.id, branch);
    }
  });
  const derivedVisits = (attendance.data ?? []).flatMap((row) => {
    const entry = mapAttendanceRow(row as Record<string, unknown>);
    const session = mappedSessions.find((item) => item.id === entry.sessionId);

    if (!session?.branchId || entry.status === "Missed") {
      return [];
    }

    return [
      {
        id: `visit-${entry.id}`,
        memberId: entry.memberId,
        branchId: session.branchId,
        visitDate: new Date().toISOString().slice(0, 10),
        source: "Attendance",
        note: `${session.title} ${entry.status.toLowerCase()}.`,
      } satisfies BranchVisit,
    ];
  });

  return {
    profiles: mappedProfiles,
    userPermissions: userPermissions.error
      ? []
      : (userPermissions.data ?? []).map((row) =>
          mapUserPermissionRow(row as Record<string, unknown>),
        ),
    gymBranches: Array.from(branchMap.values()),
    branchVisits: derivedVisits,
    memberships: (memberships.data ?? []).map((row) =>
      mapMembershipRow(row as Record<string, unknown>),
    ),
    invoices: (invoices.data ?? []).map((row) => mapInvoiceRow(row as Record<string, unknown>)),
    inventoryItems: (inventoryItems.data ?? []).map((row) =>
      mapInventoryItemRow(row as Record<string, unknown>),
    ),
    inventorySales: (inventorySales.data ?? []).map((row) =>
      mapInventorySaleRow(row as Record<string, unknown>),
    ),
    exercises: (exercises.data ?? []).map((row) => mapExerciseRow(row as Record<string, unknown>)),
    workoutPlans: (workoutPlans.data ?? []).map((row) =>
      mapWorkoutPlanRow(row as Record<string, unknown>),
    ),
    assignments: (assignments.data ?? []).map((row) =>
      mapAssignmentRow(row as Record<string, unknown>),
    ),
    workoutLogs: (workoutLogs.data ?? []).map((row) =>
      mapWorkoutLogRow(row as Record<string, unknown>),
    ),
    progressCheckIns: (progressCheckIns.data ?? []).map((row) =>
      mapProgressCheckInRow(row as Record<string, unknown>),
    ),
    progressPhotos: (progressPhotos.data ?? []).map((row) =>
      mapProgressPhotoRow(row as Record<string, unknown>),
    ),
    sessions: mappedSessions,
    attendance: (attendance.data ?? []).map((row) =>
      mapAttendanceRow(row as Record<string, unknown>),
    ),
  };
}

export async function upsertSupabaseUserPermission(permission: UserPermission) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { error } = await supabase.from("user_permissions").upsert(
    {
      user_id: permission.userId,
      access_label: permission.accessLabel ?? "",
      allowed_routes: permission.allowedRoutes,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error(error.message);
  }

  return permission;
}

export async function createSupabaseGymBranch(input: Omit<GymBranch, "id">) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const branch: GymBranch = {
    id: `branch-${crypto.randomUUID()}`,
    ...input,
  };

  const { error } = await supabase.from("gym_branches").insert({
    id: branch.id,
    name: branch.name,
    city: branch.city,
    address: branch.address,
    manager_name: branch.managerName,
    phone: branch.phone,
    kind: branch.kind,
  });

  if (error) {
    throw new Error(error.message);
  }

  return branch;
}

export async function updateSupabaseGymBranch(id: string, input: Omit<GymBranch, "id">) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const branch: GymBranch = { id, ...input };

  const { error } = await supabase
    .from("gym_branches")
    .update({
      name: branch.name,
      city: branch.city,
      address: branch.address,
      manager_name: branch.managerName,
      phone: branch.phone,
      kind: branch.kind,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return branch;
}

export async function createSupabaseExercise(input: Omit<AppData["exercises"][number], "id">) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const exercise = {
    id: `exercise-${crypto.randomUUID()}`,
    ...input,
  };

  const { error } = await supabase.from("exercises").insert({
    id: exercise.id,
    name: exercise.name,
    category: exercise.category,
    difficulty: exercise.difficulty,
    primary_muscle: exercise.primaryMuscle,
    equipment: exercise.equipment,
    media_type: exercise.mediaType,
    media_url: exercise.mediaUrl,
    cues: exercise.cues,
  });

  if (error) {
    throw new Error(error.message);
  }

  return exercise;
}

export async function updateSupabaseExercise(
  id: string,
  input: Omit<AppData["exercises"][number], "id">,
) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const exercise = {
    id,
    ...input,
  };

  const { error } = await supabase
    .from("exercises")
    .update({
      name: exercise.name,
      category: exercise.category,
      difficulty: exercise.difficulty,
      primary_muscle: exercise.primaryMuscle,
      equipment: exercise.equipment,
      media_type: exercise.mediaType,
      media_url: exercise.mediaUrl,
      cues: exercise.cues,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return exercise;
}

export async function getSupabaseIntegrationApiKeys() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("integration_api_keys")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return null;
  }

  return (data ?? []).map((row) => mapIntegrationApiKeyRow(row as Record<string, unknown>));
}

export async function createSupabaseIntegrationApiKey(key: IntegrationApiKey) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { error } = await supabase.from("integration_api_keys").insert({
    id: key.id,
    name: key.name,
    key_prefix: key.keyPrefix,
    key_hash: key.keyHash,
    scopes: key.scopes,
    status: key.status,
    created_at: key.createdAt,
    last_used_at: key.lastUsedAt || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return key;
}

export async function revokeSupabaseIntegrationApiKey(id: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { error } = await supabase
    .from("integration_api_keys")
    .update({ status: "revoked" })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  const keys = await getSupabaseIntegrationApiKeys();
  return keys?.find((item) => item.id === id) ?? null;
}

export async function touchSupabaseIntegrationApiKey(id: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const lastUsedAt = new Date().toISOString();
  const { error } = await supabase
    .from("integration_api_keys")
    .update({ last_used_at: lastUsedAt })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return lastUsedAt;
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

export async function deleteSupabaseForm(formId: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { error } = await supabase.from("intake_forms").delete().eq("id", formId);

  if (error) {
    throw new Error(error.message);
  }

  return { id: formId };
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

export async function updateSupabaseSessionZoomLink(
  sessionId: string,
  input: { zoomLink: string; room?: string },
) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const updatePayload: Record<string, string> = {
    zoom_link: input.zoomLink,
  };

  if (input.room !== undefined) {
    updatePayload.room = input.room;
  }

  const { data, error } = await supabase
    .from("classes_or_sessions")
    .update(updatePayload)
    .eq("id", sessionId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapSessionRow(data as Record<string, unknown>) as ClassSession;
}

export async function upsertSupabaseAttendanceEntry(input: {
  sessionId: string;
  memberId: string;
  status: Attendance["status"];
}) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data: existing, error: existingError } = await supabase
    .from("attendance")
    .select("*")
    .eq("session_id", input.sessionId)
    .eq("member_id", input.memberId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  const payload = {
    id: existing?.id ?? `attendance-${input.sessionId}-${input.memberId}`,
    session_id: input.sessionId,
    member_id: input.memberId,
    status: input.status,
  };

  const operation = existing
    ? supabase.from("attendance").update({ status: input.status }).eq("id", existing.id).select("*").single()
    : supabase.from("attendance").insert(payload).select("*").single();

  const { data, error } = await operation;

  if (error) {
    throw new Error(error.message);
  }

  return mapAttendanceRow(data as Record<string, unknown>) as Attendance;
}

export async function getSupabaseBusinessStore() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const [leads, dietPlans, customCampaigns, trainerNotes] = await Promise.all([
    supabase.from("leads").select("*"),
    supabase.from("diet_plans").select("*"),
    supabase.from("custom_whatsapp_campaigns").select("*"),
    supabase.from("trainer_notes").select("*"),
  ]);

  if ([leads, dietPlans, customCampaigns, trainerNotes].some((result) => result.error)) {
    return null;
  }

  return {
    leads: (leads.data ?? []).map((row) => mapLeadRow(row as Record<string, unknown>)),
    dietPlans: (dietPlans.data ?? []).map((row) =>
      mapDietPlanRow(row as Record<string, unknown>),
    ),
    customCampaigns: (customCampaigns.data ?? []).map((row) =>
      mapCustomCampaignRow(row as Record<string, unknown>),
    ),
    trainerNotes: (trainerNotes.data ?? []).map((row) =>
      mapTrainerNoteRow(row as Record<string, unknown>),
    ),
  };
}

export async function createSupabaseLead(input: Omit<LeadRecord, "id">) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const lead: LeadRecord = { id: `lead-${crypto.randomUUID()}`, ...input };
  const { error } = await supabase.from("leads").insert({
    id: lead.id,
    full_name: lead.fullName,
    phone: lead.phone,
    goal: lead.goal,
    source: lead.source,
    status: lead.status,
    assigned_to: lead.assignedTo,
    next_follow_up: lead.nextFollowUp,
    note: lead.note,
  });

  if (error) {
    throw new Error(error.message);
  }

  return lead;
}

export async function updateSupabaseLead(id: string, input: Omit<LeadRecord, "id">) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const lead: LeadRecord = { id, ...input };
  const { error } = await supabase
    .from("leads")
    .update({
      full_name: lead.fullName,
      phone: lead.phone,
      goal: lead.goal,
      source: lead.source,
      status: lead.status,
      assigned_to: lead.assignedTo,
      next_follow_up: lead.nextFollowUp,
      note: lead.note,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return lead;
}

export async function deleteSupabaseLead(id: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }

  return { id };
}

export async function upsertSupabaseLeads(leads: LeadRecord[]) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const rows = leads.map((lead) => ({
    id: lead.id || `lead-${crypto.randomUUID()}`,
    full_name: lead.fullName,
    phone: lead.phone,
    goal: lead.goal,
    source: lead.source,
    status: lead.status,
    assigned_to: lead.assignedTo,
    next_follow_up: lead.nextFollowUp,
    note: lead.note,
  }));

  const { data, error } = await supabase.from("leads").upsert(rows, { onConflict: "id" }).select("*");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapLeadRow(row as Record<string, unknown>));
}

export async function createSupabaseDietPlan(input: Omit<DietPlanRecord, "id">) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const plan: DietPlanRecord = { id: `diet-${crypto.randomUUID()}`, ...input };
  const { error } = await supabase.from("diet_plans").insert({
    id: plan.id,
    member_name: plan.memberName,
    coach: plan.coach,
    goal: plan.goal,
    calories: plan.calories,
    protein_grams: plan.proteinGrams,
    meals: plan.meals,
    adherence: plan.adherence,
    updated_on: plan.updatedOn,
  });

  if (error) {
    throw new Error(error.message);
  }

  return plan;
}

export async function updateSupabaseDietPlan(id: string, input: Omit<DietPlanRecord, "id">) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const plan: DietPlanRecord = { id, ...input };
  const { error } = await supabase
    .from("diet_plans")
    .update({
      member_name: plan.memberName,
      coach: plan.coach,
      goal: plan.goal,
      calories: plan.calories,
      protein_grams: plan.proteinGrams,
      meals: plan.meals,
      adherence: plan.adherence,
      updated_on: plan.updatedOn,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return plan;
}

export async function deleteSupabaseDietPlan(id: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { error } = await supabase.from("diet_plans").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }

  return { id };
}

export async function createSupabaseCustomCampaign(
  input: Omit<CustomWhatsAppCampaign, "id" | "category">,
) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const campaign: CustomWhatsAppCampaign = {
    id: `campaign-${crypto.randomUUID()}`,
    category: "Custom",
    ...input,
  };
  const { error } = await supabase.from("custom_whatsapp_campaigns").insert({
    id: campaign.id,
    title: campaign.title,
    scheduled_for: campaign.scheduledFor,
    message: campaign.message,
    recipients: campaign.recipients,
  });

  if (error) {
    throw new Error(error.message);
  }

  return campaign;
}

export async function updateSupabaseCustomCampaign(
  id: string,
  input: Omit<CustomWhatsAppCampaign, "id" | "category">,
) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const campaign: CustomWhatsAppCampaign = { id, category: "Custom", ...input };
  const { error } = await supabase
    .from("custom_whatsapp_campaigns")
    .update({
      title: campaign.title,
      scheduled_for: campaign.scheduledFor,
      message: campaign.message,
      recipients: campaign.recipients,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return campaign;
}

export async function deleteSupabaseCustomCampaign(id: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { error } = await supabase.from("custom_whatsapp_campaigns").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }

  return { id };
}

export async function createSupabaseTrainerNote(input: Omit<TrainerClientNote, "id">) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const note: TrainerClientNote = { id: `trainer-note-${crypto.randomUUID()}`, ...input };
  const { error } = await supabase.from("trainer_notes").insert({
    id: note.id,
    member_id: note.memberId,
    member_name: note.memberName,
    trainer_name: note.trainerName,
    note: note.note,
    focus_area: note.focusArea,
    updated_on: note.updatedOn,
  });

  if (error) {
    throw new Error(error.message);
  }

  return note;
}

export async function updateSupabaseTrainerNote(
  id: string,
  input: Omit<TrainerClientNote, "id">,
) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const note: TrainerClientNote = { id, ...input };
  const { error } = await supabase
    .from("trainer_notes")
    .update({
      member_id: note.memberId,
      member_name: note.memberName,
      trainer_name: note.trainerName,
      note: note.note,
      focus_area: note.focusArea,
      updated_on: note.updatedOn,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return note;
}

export async function deleteSupabaseTrainerNote(id: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { error } = await supabase.from("trainer_notes").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }

  return { id };
}
