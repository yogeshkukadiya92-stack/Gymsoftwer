import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const cwd = process.cwd();
const appDataPath = path.join(cwd, "data", "app-data.json");
const formsStorePath = path.join(cwd, "data", "forms-store.json");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.",
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function readJson(filePath) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

function mapProfiles(profiles) {
  return profiles.map((profile) => ({
    id: profile.id,
    full_name: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    role: profile.role,
    fitness_goal: profile.fitnessGoal,
    branch: profile.branch,
    joined_on: profile.joinedOn,
  }));
}

function mapMemberships(memberships) {
  return memberships.map((item) => ({
    id: item.id,
    member_id: item.memberId,
    plan_name: item.planName,
    status: item.status,
    start_date: item.startDate,
    renewal_date: item.renewalDate,
    billing_cycle: item.billingCycle,
    amount_inr: item.amountInr,
    payment_status: item.paymentStatus,
    last_payment_date: item.lastPaymentDate || null,
    next_invoice_date: item.nextInvoiceDate || null,
    payment_method: item.paymentMethod || null,
    outstanding_amount_inr: item.outstandingAmountInr,
  }));
}

function mapInvoices(invoices) {
  return invoices.map((item) => ({
    id: item.id,
    membership_id: item.membershipId,
    member_id: item.memberId,
    invoice_number: item.invoiceNumber,
    issued_on: item.issuedOn,
    due_on: item.dueOn,
    amount_inr: item.amountInr,
    status: item.status,
    paid_on: item.paidOn || null,
    payment_method: item.paymentMethod || null,
  }));
}

function mapInventoryItems(items) {
  return items.map((item) => ({
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
}

function mapInventorySales(items) {
  return items.map((item) => ({
    id: item.id,
    item_id: item.itemId,
    sold_on: item.soldOn,
    quantity: item.quantity,
    total_amount_inr: item.totalAmountInr,
    customer_name: item.customerName,
    payment_method: item.paymentMethod,
  }));
}

function mapExercises(items) {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    difficulty: item.difficulty,
    primary_muscle: item.primaryMuscle,
    equipment: item.equipment,
    media_type: item.mediaType,
    media_url: item.mediaUrl,
    cues: item.cues,
  }));
}

function mapWorkoutPlans(plans) {
  return plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    goal: plan.goal,
    coach: plan.coach,
    split: plan.split,
    duration_weeks: plan.durationWeeks,
  }));
}

function mapWorkoutPlanExercises(plans) {
  return plans.flatMap((plan) =>
    plan.exercises.map((item) => ({
      id: item.id,
      workout_plan_id: plan.id,
      exercise_id: item.exerciseId,
      sets: item.sets,
      reps: item.reps,
      rest_seconds: item.restSeconds,
      notes: item.notes,
    })),
  );
}

function mapAssignments(items) {
  return items.map((item) => ({
    id: item.id,
    plan_id: item.planId,
    member_id: item.memberId,
    start_date: item.startDate,
    status: item.status,
  }));
}

function mapWorkoutLogs(items) {
  return items.map((item) => ({
    id: item.id,
    member_id: item.memberId,
    exercise_id: item.exerciseId,
    date: item.date,
    sets_completed: item.setsCompleted,
    reps_completed: item.repsCompleted,
    weight_kg: item.weightKg,
    notes: item.notes,
  }));
}

function mapProgressCheckIns(items) {
  return items.map((item) => ({
    id: item.id,
    member_id: item.memberId,
    recorded_on: item.recordedOn,
    weight_kg: item.weightKg,
    waist_cm: item.waistCm,
    hips_cm: item.hipsCm,
    chest_cm: item.chestCm,
    thigh_cm: item.thighCm,
    coach_note: item.coachNote,
    energy_level: item.energyLevel,
  }));
}

function mapProgressPhotos(items) {
  return items.map((item) => ({
    id: item.id,
    member_id: item.memberId,
    recorded_on: item.recordedOn,
    label: item.label,
    image_url: item.imageUrl,
    note: item.note,
  }));
}

function mapSessions(items) {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    coach: item.coach,
    day: item.day,
    time: item.time,
    capacity: item.capacity,
    room: item.room,
  }));
}

function mapAttendance(items) {
  return items.map((item) => ({
    id: item.id,
    session_id: item.sessionId,
    member_id: item.memberId,
    status: item.status,
  }));
}

function mapForms(items) {
  return items.map((item) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    description: item.description,
    audience: item.audience,
    status: item.status,
    fields: item.fields,
  }));
}

function mapFormResponses(items) {
  return items.map((item) => ({
    id: item.id,
    form_id: item.formId,
    submitted_at: item.submittedAt.replace(" ", "T"),
    answers: item.answers,
  }));
}

async function upsertTable(table, rows, onConflict) {
  if (!rows.length) {
    return;
  }

  const query = supabase.from(table).upsert(rows, onConflict ? { onConflict } : undefined);
  const { error } = await query;

  if (error) {
    throw new Error(`${table}: ${error.message}`);
  }
}

async function main() {
  const appData = await readJson(appDataPath);
  const formsStore = await readJson(formsStorePath);

  await upsertTable("profiles", mapProfiles(appData.profiles), "id");
  await upsertTable("memberships", mapMemberships(appData.memberships), "id");
  await upsertTable("invoices", mapInvoices(appData.invoices), "id");
  await upsertTable("inventory_items", mapInventoryItems(appData.inventoryItems ?? []), "sku");
  await upsertTable("inventory_sales", mapInventorySales(appData.inventorySales ?? []), "id");
  await upsertTable("exercises", mapExercises(appData.exercises), "id");
  await upsertTable("workout_plans", mapWorkoutPlans(appData.workoutPlans), "id");
  await upsertTable(
    "workout_plan_exercises",
    mapWorkoutPlanExercises(appData.workoutPlans),
    "id",
  );
  await upsertTable(
    "member_workout_assignments",
    mapAssignments(appData.assignments),
    "id",
  );
  await upsertTable("workout_logs", mapWorkoutLogs(appData.workoutLogs), "id");
  await upsertTable(
    "progress_check_ins",
    mapProgressCheckIns(appData.progressCheckIns ?? []),
    "id",
  );
  await upsertTable(
    "progress_photos",
    mapProgressPhotos(appData.progressPhotos ?? []),
    "id",
  );
  await upsertTable("classes_or_sessions", mapSessions(appData.sessions), "id");
  await upsertTable("attendance", mapAttendance(appData.attendance), "id");
  await upsertTable("intake_forms", mapForms(formsStore.forms ?? []), "id");
  await upsertTable(
    "intake_form_responses",
    mapFormResponses(formsStore.responses ?? []),
    "id",
  );

  console.log("Supabase seed completed successfully.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
