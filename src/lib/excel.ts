import * as XLSX from "xlsx";

import { DEFAULT_FIRST_LOGIN_PASSWORD } from "@/lib/account-policy";
import { LeadRecord, LeadSource, LeadStatus } from "@/lib/business-data";
import {
  AppData,
  Attendance,
  ClassSession,
  InventoryItem,
  InventorySale,
  Profile,
  UserRole,
} from "@/lib/types";

const workbookSheetOrder = [
  "profiles",
  "memberships",
  "invoices",
  "exercises",
  "workout_plans",
  "workout_plan_exercises",
  "member_workout_assignments",
  "workout_logs",
  "classes_or_sessions",
  "attendance",
] as const;

type SheetName = (typeof workbookSheetOrder)[number];

type ImportSummary = {
  sheet: SheetName;
  rows: number;
};

export type ImportedUserRow = {
  id: string;
  currentEmail: string;
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string;
  fitnessGoal: string;
  branch: string;
  joinedOn: string;
};

export type ImportedLeadRow = {
  id: string;
  fullName: string;
  phone: string;
  goal: string;
  source: LeadSource;
  status: LeadStatus;
  assignedTo: string;
  nextFollowUp: string;
  note: string;
};

function toJsonSheet<T extends Record<string, unknown>>(rows: T[]) {
  return XLSX.utils.json_to_sheet(rows);
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function normalizeKeys(row: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeHeader(key), value]),
  );
}

function toStringValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function toNumberValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toArrayValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => toStringValue(item)).filter(Boolean);
  }

  return toStringValue(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildWorkbookFromAppData(data: AppData) {
  const workbook = XLSX.utils.book_new();

  const planExercises = data.workoutPlans.flatMap((plan) =>
    plan.exercises.map((exercise) => ({
      id: exercise.id,
      workout_plan_id: plan.id,
      exercise_id: exercise.exerciseId,
      sets: exercise.sets,
      reps: exercise.reps,
      rest_seconds: exercise.restSeconds,
      notes: exercise.notes,
    })),
  );

  const sheets: Record<SheetName, Record<string, unknown>[]> = {
    profiles: data.profiles.map((profile) => ({
      id: profile.id,
      full_name: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      role: profile.role,
      fitness_goal: profile.fitnessGoal,
      branch: profile.branch,
      joined_on: profile.joinedOn,
    })),
    memberships: data.memberships.map((membership) => ({
      id: membership.id,
      member_id: membership.memberId,
      plan_name: membership.planName,
      status: membership.status,
      start_date: membership.startDate,
      renewal_date: membership.renewalDate,
      billing_cycle: membership.billingCycle,
      amount_inr: membership.amountInr,
      payment_status: membership.paymentStatus,
      last_payment_date: membership.lastPaymentDate,
      next_invoice_date: membership.nextInvoiceDate,
      payment_method: membership.paymentMethod,
      outstanding_amount_inr: membership.outstandingAmountInr,
    })),
    invoices: data.invoices.map((invoice) => ({
      id: invoice.id,
      membership_id: invoice.membershipId,
      member_id: invoice.memberId,
      invoice_number: invoice.invoiceNumber,
      issued_on: invoice.issuedOn,
      due_on: invoice.dueOn,
      amount_inr: invoice.amountInr,
      status: invoice.status,
      paid_on: invoice.paidOn ?? "",
      payment_method: invoice.paymentMethod ?? "",
    })),
    exercises: data.exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      category: exercise.category,
      difficulty: exercise.difficulty,
      primary_muscle: exercise.primaryMuscle,
      equipment: exercise.equipment,
      media_type: exercise.mediaType,
      media_url: exercise.mediaUrl,
      cues: exercise.cues.join(", "),
    })),
    workout_plans: data.workoutPlans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      goal: plan.goal,
      coach: plan.coach,
      split: plan.split,
      duration_weeks: plan.durationWeeks,
    })),
    workout_plan_exercises: planExercises,
    member_workout_assignments: data.assignments.map((assignment) => ({
      id: assignment.id,
      plan_id: assignment.planId,
      member_id: assignment.memberId,
      start_date: assignment.startDate,
      status: assignment.status,
    })),
    workout_logs: data.workoutLogs.map((log) => ({
      id: log.id,
      member_id: log.memberId,
      exercise_id: log.exerciseId,
      date: log.date,
      sets_completed: log.setsCompleted,
      reps_completed: log.repsCompleted,
      weight_kg: log.weightKg,
      notes: log.notes,
    })),
    classes_or_sessions: data.sessions.map((session) => ({
      id: session.id,
      title: session.title,
      coach: session.coach,
      day: session.day,
      time: session.time,
      capacity: session.capacity,
      room: session.room,
    })),
    attendance: data.attendance.map((entry) => ({
      id: entry.id,
      session_id: entry.sessionId,
      member_id: entry.memberId,
      status: entry.status,
    })),
  };

  workbookSheetOrder.forEach((sheetName) => {
    XLSX.utils.book_append_sheet(workbook, toJsonSheet(sheets[sheetName]), sheetName);
  });

  return workbook;
}

export function buildTemplateWorkbook(data: AppData) {
  const workbook = buildWorkbookFromAppData({
    ...data,
    profiles: data.profiles.slice(0, 1),
    memberships: data.memberships.slice(0, 1),
    invoices: data.invoices.slice(0, 1),
    exercises: data.exercises.slice(0, 1),
    workoutPlans: data.workoutPlans.slice(0, 1),
    assignments: data.assignments.slice(0, 1),
    workoutLogs: data.workoutLogs.slice(0, 1),
    sessions: data.sessions.slice(0, 1),
    attendance: data.attendance.slice(0, 1),
  });

  return workbook;
}

export function workbookToBuffer(workbook: XLSX.WorkBook) {
  return XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });
}

export function buildAttendanceWorkbook(
  sessions: ClassSession[],
  attendance: Attendance[],
  profiles: Profile[],
) {
  const workbook = XLSX.utils.book_new();

  const sessionRows = sessions.map((session) => ({
    id: session.id,
    title: session.title,
    coach: session.coach,
    day: session.day,
    time: session.time,
    capacity: session.capacity,
    room: session.room,
  }));

  const attendeeRows = attendance.map((entry) => {
    const profile = profiles.find((item) => item.id === entry.memberId);

    return {
      id: entry.id,
      session_id: entry.sessionId,
      member_id: entry.memberId,
      member_name: profile?.fullName ?? "",
      member_email: profile?.email ?? "",
      status: entry.status,
    };
  });

  XLSX.utils.book_append_sheet(workbook, toJsonSheet(sessionRows), "classes_or_sessions");
  XLSX.utils.book_append_sheet(workbook, toJsonSheet(attendeeRows), "attendance");

  return workbook;
}

export function buildAttendanceTemplateWorkbook(
  sessions: ClassSession[],
  attendance: Attendance[],
  profiles: Profile[],
) {
  return buildAttendanceWorkbook(
    sessions.slice(0, 2),
    attendance.slice(0, 3),
    profiles,
  );
}

export function buildMembersWorkbook(profiles: Profile[]) {
  const workbook = XLSX.utils.book_new();

  const memberRows = profiles
    .filter((profile) => profile.role === "member")
    .map((profile) => ({
      id: profile.id,
      full_name: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      role: profile.role,
      fitness_goal: profile.fitnessGoal,
      branch: profile.branch,
      joined_on: profile.joinedOn,
    }));

  XLSX.utils.book_append_sheet(workbook, toJsonSheet(memberRows), "profiles");

  return workbook;
}

export function buildMembersTemplateWorkbook() {
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    toJsonSheet([
      {
        id: "member-101",
        full_name: "Client Name",
        email: "client@example.com",
        phone: "+91 98765 00000",
        role: "member",
        fitness_goal: "Weight loss",
        branch: "Main Branch",
        joined_on: "2026-03-18",
      },
    ]),
    "profiles",
  );

  return workbook;
}

export function buildUsersWorkbook(
  profiles: Profile[],
  options?: {
    accessLabels?: Record<string, string>;
    loginStatuses?: Record<string, string>;
  },
) {
  const workbook = XLSX.utils.book_new();

  const userRows = profiles.map((profile) => ({
    id: profile.id,
    current_email: profile.email,
    full_name: profile.fullName,
    email: profile.email,
    password: DEFAULT_FIRST_LOGIN_PASSWORD,
    role: profile.role,
    phone: profile.phone,
    fitness_goal: profile.fitnessGoal,
    branch: profile.branch,
    joined_on: profile.joinedOn,
    access_label: options?.accessLabels?.[profile.id] ?? "",
    login_status: options?.loginStatuses?.[profile.id] ?? "",
  }));

  XLSX.utils.book_append_sheet(workbook, toJsonSheet(userRows), "users");

  return workbook;
}

export function buildUsersTemplateWorkbook() {
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    toJsonSheet([
      {
        id: "",
        current_email: "",
        full_name: "Admin User",
        email: "admin@example.com",
        password: DEFAULT_FIRST_LOGIN_PASSWORD,
        role: "admin",
        phone: "+91 98765 00000",
        fitness_goal: "Operations oversight",
        branch: "Main Branch",
        joined_on: "2026-03-28",
      },
      {
        id: "",
        current_email: "",
        full_name: "Trainer User",
        email: "trainer@example.com",
        password: DEFAULT_FIRST_LOGIN_PASSWORD,
        role: "trainer",
        phone: "+91 98765 11111",
        fitness_goal: "Coach performance",
        branch: "Main Branch",
        joined_on: "2026-03-28",
      },
      {
        id: "",
        current_email: "",
        full_name: "Member User",
        email: "member@example.com",
        password: DEFAULT_FIRST_LOGIN_PASSWORD,
        role: "member",
        phone: "+91 98765 22222",
        fitness_goal: "Weight loss",
        branch: "Main Branch",
        joined_on: "2026-03-28",
      },
    ]),
    "users",
  );

  return workbook;
}

export function buildUserPermissionsWorkbook(
  profiles: Profile[],
  permissions: AppData["userPermissions"],
) {
  const workbook = XLSX.utils.book_new();

  const permissionRows = profiles.map((profile) => {
    const permission = permissions.find((item) => item.userId === profile.id);

    return {
      user_id: profile.id,
      full_name: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      role: profile.role,
      branch: profile.branch,
      access_label: permission?.accessLabel ?? "",
      allowed_routes_count: permission?.allowedRoutes.length ?? 0,
      allowed_routes: (permission?.allowedRoutes ?? []).join(", "),
    };
  });

  XLSX.utils.book_append_sheet(workbook, toJsonSheet(permissionRows), "user_permissions");

  return workbook;
}

export function buildLeadsWorkbook(leads: LeadRecord[]) {
  const workbook = XLSX.utils.book_new();

  const leadRows = leads.map((lead) => ({
    id: lead.id,
    full_name: lead.fullName,
    phone: lead.phone,
    goal: lead.goal,
    source: lead.source,
    status: lead.status,
    assigned_to: lead.assignedTo,
    next_follow_up: lead.nextFollowUp,
    note: lead.note,
  }));

  XLSX.utils.book_append_sheet(workbook, toJsonSheet(leadRows), "leads");

  return workbook;
}

export function buildLeadsTemplateWorkbook() {
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    toJsonSheet([
      {
        id: "",
        full_name: "Khushi Patel",
        phone: "+91 98765 30001",
        goal: "Fat loss with online accountability",
        source: "Instagram",
        status: "New",
        assigned_to: "Yogesh Kukadiya",
        next_follow_up: "2026-03-30",
        note: "Asked about morning Zoom batch and diet support.",
      },
      {
        id: "",
        full_name: "Ritesh Sharma",
        phone: "+91 98765 30002",
        goal: "Strength and posture correction",
        source: "Referral",
        status: "Contacted",
        assigned_to: "Naina Kapoor",
        next_follow_up: "2026-03-31",
        note: "Interested in trainer-led hybrid plan with supplement advice.",
      },
    ]),
    "leads",
  );

  return workbook;
}

export function buildInventoryWorkbook(
  items: InventoryItem[],
  sales: InventorySale[],
) {
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    toJsonSheet(
      items.map((item) => ({
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
        expiry_date: item.expiryDate,
        stock_units: item.stockUnits,
        reorder_level: item.reorderLevel,
        cost_price_inr: item.costPriceInr,
        selling_price_inr: item.sellingPriceInr,
        status: item.status,
      })),
    ),
    "inventory_items",
  );

  XLSX.utils.book_append_sheet(
    workbook,
    toJsonSheet(
      sales.map((sale) => ({
        id: sale.id,
        item_id: sale.itemId,
        sold_on: sale.soldOn,
        quantity: sale.quantity,
        total_amount_inr: sale.totalAmountInr,
        customer_name: sale.customerName,
        payment_method: sale.paymentMethod,
      })),
    ),
    "inventory_sales",
  );

  return workbook;
}

export function buildInventoryTemplateWorkbook() {
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    toJsonSheet([
      {
        id: "inventory-101",
        name: "Creatine Monohydrate",
        category: "Creatine",
        supplement_type: "Creatine monohydrate",
        brand: "Brand Name",
        flavor: "Unflavored",
        supplier_name: "Supplier Name",
        sku: "CRT-500G",
        batch_code: "CRT-2403-A",
        unit_size: "500 g jar",
        expiry_date: "2027-03-31",
        stock_units: 20,
        reorder_level: 6,
        cost_price_inr: 650,
        selling_price_inr: 999,
      },
    ]),
    "inventory_items",
  );

  return workbook;
}

export function buildBillingWorkbook(data: AppData) {
  const workbook = XLSX.utils.book_new();
  const memberRows = data.profiles
    .filter((profile) => profile.role === "member")
    .map((profile) => {
      const memberships = data.memberships.filter((membership) => membership.memberId === profile.id);
      const invoices = data.invoices.filter((invoice) => invoice.memberId === profile.id);
      const collectedAmount = invoices
        .filter((invoice) => invoice.status === "Paid")
        .reduce((sum, invoice) => sum + invoice.amountInr, 0);
      const outstandingAmount = memberships.reduce(
        (sum, membership) => sum + membership.outstandingAmountInr,
        0,
      );

      return {
        member_id: profile.id,
        member_name: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        branch: profile.branch,
        total_memberships: memberships.length,
        collected_inr: collectedAmount,
        outstanding_inr: outstandingAmount,
        paid_invoices: invoices.filter((invoice) => invoice.status === "Paid").length,
        pending_invoices: invoices.filter((invoice) => invoice.status === "Pending").length,
        overdue_invoices: invoices.filter((invoice) => invoice.status === "Overdue").length,
      };
    });

  const invoiceRows = data.invoices.map((invoice) => {
    const member = data.profiles.find((profile) => profile.id === invoice.memberId);
    const membership = data.memberships.find((item) => item.id === invoice.membershipId);

    return {
      id: invoice.id,
      invoice_number: invoice.invoiceNumber,
      member_id: invoice.memberId,
      member_name: member?.fullName ?? "",
      membership_id: invoice.membershipId,
      plan_name: membership?.planName ?? "",
      issued_on: invoice.issuedOn,
      due_on: invoice.dueOn,
      amount_inr: invoice.amountInr,
      status: invoice.status,
      paid_on: invoice.paidOn ?? "",
      payment_method: invoice.paymentMethod ?? "",
    };
  });

  const membershipRows = data.memberships.map((membership) => {
    const member = data.profiles.find((profile) => profile.id === membership.memberId);

    return {
      id: membership.id,
      member_id: membership.memberId,
      member_name: member?.fullName ?? "",
      plan_name: membership.planName,
      status: membership.status,
      billing_cycle: membership.billingCycle,
      amount_inr: membership.amountInr,
      payment_status: membership.paymentStatus,
      last_payment_date: membership.lastPaymentDate,
      next_invoice_date: membership.nextInvoiceDate,
      outstanding_amount_inr: membership.outstandingAmountInr,
    };
  });

  XLSX.utils.book_append_sheet(workbook, toJsonSheet(memberRows), "member_summary");
  XLSX.utils.book_append_sheet(workbook, toJsonSheet(invoiceRows), "invoices");
  XLSX.utils.book_append_sheet(workbook, toJsonSheet(membershipRows), "memberships");

  return workbook;
}

export function buildReportsWorkbook(snapshot: {
  members: Array<{ id: string; fullName: string; email: string; branch: string; joinedOn: string }>;
  memberGrowth: Array<{ month: string; count: number }>;
  presentCount: number;
  absentCount: number;
  bookedCount: number;
  collectedRevenue: number;
  outstandingRevenue: number;
  overdueInvoices: number;
  estimatedInventoryMargin: number;
  topFormResponses: Array<{ id: string; title: string; responses: number }>;
  trainerRows: Array<{ id: string; fullName: string; activePlans: number; classes: number }>;
  leads: Array<{ id: string; fullName: string; source: string; status: string; assignedTo: string }>;
  leadStats: { total: number; converted: number; activeTrials: number; new: number };
  avgDietAdherence: number;
}) {
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    toJsonSheet([
      {
        total_members: snapshot.members.length,
        present_count: snapshot.presentCount,
        booked_count: snapshot.bookedCount,
        absent_count: snapshot.absentCount,
        collected_revenue_inr: snapshot.collectedRevenue,
        outstanding_revenue_inr: snapshot.outstandingRevenue,
        overdue_invoices: snapshot.overdueInvoices,
        inventory_margin_inr: snapshot.estimatedInventoryMargin,
        lead_total: snapshot.leadStats.total,
        lead_converted: snapshot.leadStats.converted,
        lead_trial_booked: snapshot.leadStats.activeTrials,
        lead_new: snapshot.leadStats.new,
        avg_diet_adherence_percent: Math.round(snapshot.avgDietAdherence),
      },
    ]),
    "overview",
  );

  XLSX.utils.book_append_sheet(workbook, toJsonSheet(snapshot.memberGrowth), "member_growth");
  XLSX.utils.book_append_sheet(
    workbook,
    toJsonSheet(
      snapshot.trainerRows.map((trainer) => ({
        id: trainer.id,
        full_name: trainer.fullName,
        active_plans: trainer.activePlans,
        classes: trainer.classes,
      })),
    ),
    "trainer_workload",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    toJsonSheet(
      snapshot.topFormResponses.map((form) => ({
        id: form.id,
        title: form.title,
        responses: form.responses,
      })),
    ),
    "forms",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    toJsonSheet(
      snapshot.leads.map((lead) => ({
        id: lead.id,
        full_name: lead.fullName,
        source: lead.source,
        status: lead.status,
        assigned_to: lead.assignedTo,
      })),
    ),
    "leads",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    toJsonSheet(
      snapshot.members.map((member) => ({
        id: member.id,
        full_name: member.fullName,
        email: member.email,
        branch: member.branch,
        joined_on: member.joinedOn,
      })),
    ),
    "members",
  );

  return workbook;
}

export function parseMembersWorkbook(buffer: ArrayBuffer) {
  const workbook = XLSX.read(buffer, { type: "array" });

  if (!workbook.SheetNames.includes("profiles")) {
    throw new Error("Missing sheet: profiles. Please use the member template file.");
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    workbook.Sheets.profiles,
    {
      defval: "",
    },
  );

  const profiles = rows.map((row) => {
    const item = normalizeKeys(row);

    return {
      id: toStringValue(item.id),
      fullName: toStringValue(item.full_name),
      email: toStringValue(item.email),
      phone: toStringValue(item.phone),
      role: (toStringValue(item.role) || "member") as "member" | "trainer" | "admin",
      fitnessGoal: toStringValue(item.fitness_goal),
      branch: toStringValue(item.branch),
      joinedOn: toStringValue(item.joined_on),
    };
  });

  const members = profiles.filter((profile) => profile.role === "member");
  const missingRequired = members.filter(
    (member) => !member.fullName || !member.email || !member.phone,
  );

  if (missingRequired.length > 0) {
    throw new Error(
      "Some member rows are missing required values. full_name, email, and phone are required.",
    );
  }

  const duplicateEmails = members.filter(
    (member, index) =>
      members.findIndex((item) => item.email.toLowerCase() === member.email.toLowerCase()) !==
      index,
  );

  return {
    members,
    summary: [{ sheet: "profiles", rows: members.length }],
    duplicateEmails: duplicateEmails.map((item) => item.email),
  };
}

export function parseUsersWorkbook(buffer: ArrayBuffer) {
  const workbook = XLSX.read(buffer, { type: "array" });

  if (!workbook.SheetNames.includes("users")) {
    throw new Error("Missing sheet: users. Please use the users template file.");
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets.users, {
    defval: "",
  });

  const users = rows.map((row) => {
    const item = normalizeKeys(row);
    const roleValue = (toStringValue(item.role) || "member").toLowerCase();
    const role = ["member", "trainer", "admin"].includes(roleValue)
      ? (roleValue as UserRole)
      : "member";

    return {
      id: toStringValue(item.id),
      currentEmail: toStringValue(item.current_email),
      fullName: toStringValue(item.full_name),
      email: toStringValue(item.email),
      password: toStringValue(item.password),
      role,
      phone: toStringValue(item.phone),
      fitnessGoal: toStringValue(item.fitness_goal),
      branch: toStringValue(item.branch),
      joinedOn: toStringValue(item.joined_on),
    } satisfies ImportedUserRow;
  });

  const missingRequired = users.filter((user) => !user.fullName || !user.email || !user.role);

  if (missingRequired.length > 0) {
    throw new Error("Some user rows are missing required values. full_name, email, and role are required.");
  }

  const duplicateEmails = users.filter(
    (user, index) =>
      users.findIndex((item) => item.email.toLowerCase() === user.email.toLowerCase()) !== index,
  );

  return {
    users,
    summary: [{ sheet: "profiles" as const, rows: users.length }],
    duplicateEmails: duplicateEmails.map((item) => item.email),
  };
}

export function parseLeadsWorkbook(buffer: ArrayBuffer) {
  const workbook = XLSX.read(buffer, { type: "array" });

  if (!workbook.SheetNames.includes("leads")) {
    throw new Error("Missing sheet: leads. Please use the leads template file.");
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets.leads, {
    defval: "",
  });

  const validSources: LeadSource[] = [
    "WhatsApp",
    "Instagram",
    "Referral",
    "Walk-in",
    "Website",
  ];
  const validStatuses: LeadStatus[] = [
    "New",
    "Contacted",
    "Trial Booked",
    "Converted",
    "Lost",
  ];

  const leads = rows.map((row) => {
    const item = normalizeKeys(row);
    const sourceValue = toStringValue(item.source);
    const statusValue = toStringValue(item.status);

    return {
      id: toStringValue(item.id),
      fullName: toStringValue(item.full_name),
      phone: toStringValue(item.phone),
      goal: toStringValue(item.goal),
      source: validSources.includes(sourceValue as LeadSource)
        ? (sourceValue as LeadSource)
        : "Website",
      status: validStatuses.includes(statusValue as LeadStatus)
        ? (statusValue as LeadStatus)
        : "New",
      assignedTo: toStringValue(item.assigned_to),
      nextFollowUp: toStringValue(item.next_follow_up) || new Date().toISOString().slice(0, 10),
      note: toStringValue(item.note),
    } satisfies ImportedLeadRow;
  });

  const missingRequired = leads.filter((lead) => !lead.fullName || !lead.phone);

  if (missingRequired.length > 0) {
    throw new Error("Some lead rows are missing required values. full_name and phone are required.");
  }

  const duplicatePhones = leads.filter(
    (lead, index) =>
      leads.findIndex((item) => item.phone.toLowerCase() === lead.phone.toLowerCase()) !== index,
  );

  return {
    leads,
    summary: [{ sheet: "profiles" as const, rows: leads.length }],
    duplicatePhones: duplicatePhones.map((item) => item.phone),
  };
}

export function parseInventoryWorkbook(buffer: ArrayBuffer) {
  const workbook = XLSX.read(buffer, { type: "array" });

  if (!workbook.SheetNames.includes("inventory_items")) {
    throw new Error(
      "Missing sheet: inventory_items. Please use the inventory template file.",
    );
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    workbook.Sheets.inventory_items,
    {
      defval: "",
    },
  );

  const items = rows.map((row) => {
    const item = normalizeKeys(row);
    const stockUnits = toNumberValue(item.stock_units);
    const reorderLevel = toNumberValue(item.reorder_level);

    return {
      id: toStringValue(item.id) || `inventory-${crypto.randomUUID()}`,
      name: toStringValue(item.name),
      category: toStringValue(item.category) || "Supplement",
      supplementType: toStringValue(item.supplement_type),
      brand: toStringValue(item.brand),
      flavor: toStringValue(item.flavor),
      supplierName: toStringValue(item.supplier_name),
      sku: toStringValue(item.sku),
      batchCode: toStringValue(item.batch_code),
      unitSize: toStringValue(item.unit_size),
      expiryDate: toStringValue(item.expiry_date),
      stockUnits,
      reorderLevel,
      costPriceInr: toNumberValue(item.cost_price_inr),
      sellingPriceInr: toNumberValue(item.selling_price_inr),
      status:
        stockUnits <= 0
          ? "Out of Stock"
          : stockUnits <= reorderLevel
            ? "Low Stock"
            : "In Stock",
    } as InventoryItem;
  });

  const missingRequired = items.filter((item) => !item.name || !item.sku);

  if (missingRequired.length > 0) {
    throw new Error("Some inventory rows are missing required values. name and sku are required.");
  }

  return {
    items,
    summary: [{ sheet: "inventory_items", rows: items.length }],
  };
}

export function parseAttendanceWorkbook(buffer: ArrayBuffer) {
  const workbook = XLSX.read(buffer, { type: "array" });
  const requiredSheets = ["classes_or_sessions", "attendance"] as const;
  const missingSheets = requiredSheets.filter(
    (sheetName) => !workbook.SheetNames.includes(sheetName),
  );

  if (missingSheets.length > 0) {
    throw new Error(
      `Missing sheet(s): ${missingSheets.join(", ")}. Please use the attendance template file.`,
    );
  }

  const getRows = (sheetName: (typeof requiredSheets)[number]) =>
    XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
      defval: "",
    });

  const sessions = getRows("classes_or_sessions").map((row) => {
    const item = normalizeKeys(row);

    return {
      id: toStringValue(item.id),
      title: toStringValue(item.title),
      coach: toStringValue(item.coach),
      day: toStringValue(item.day),
      time: toStringValue(item.time),
      capacity: toNumberValue(item.capacity),
      room: toStringValue(item.room),
    };
  });

  const attendance = getRows("attendance").map((row) => {
    const item = normalizeKeys(row);

    return {
      id: toStringValue(item.id),
      sessionId: toStringValue(item.session_id),
      memberId: toStringValue(item.member_id),
      status: toStringValue(item.status) as "Booked" | "Checked In" | "Missed",
    };
  });

  return {
    sessions,
    attendance,
    summary: [
      { sheet: "classes_or_sessions", rows: sessions.length },
      { sheet: "attendance", rows: attendance.length },
    ],
  };
}

export function parseImportWorkbook(buffer: ArrayBuffer) {
  const workbook = XLSX.read(buffer, { type: "array" });
  const missingSheets = workbookSheetOrder.filter(
    (sheetName) => !workbook.SheetNames.includes(sheetName),
  );

  if (missingSheets.length > 0) {
    throw new Error(
      `Missing sheet(s): ${missingSheets.join(", ")}. Please use the export/template file structure.`,
    );
  }

  const getRows = (sheetName: SheetName) =>
    XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
      defval: "",
    });

  const profiles = getRows("profiles").map((row) => {
    const item = normalizeKeys(row);

    return {
      id: toStringValue(item.id),
      fullName: toStringValue(item.full_name),
      email: toStringValue(item.email),
      phone: toStringValue(item.phone),
      role: toStringValue(item.role) as "member" | "trainer" | "admin",
      fitnessGoal: toStringValue(item.fitness_goal),
      branch: toStringValue(item.branch),
      joinedOn: toStringValue(item.joined_on),
    };
  });

  const memberships = getRows("memberships").map((row) => {
    const item = normalizeKeys(row);

    return {
      id: toStringValue(item.id),
      memberId: toStringValue(item.member_id),
      planName: toStringValue(item.plan_name),
      status: toStringValue(item.status) as "Active" | "Expiring Soon" | "On Hold",
      startDate: toStringValue(item.start_date),
      renewalDate: toStringValue(item.renewal_date),
      billingCycle: toStringValue(item.billing_cycle) as "Monthly" | "Quarterly" | "Yearly",
      amountInr: toNumberValue(item.amount_inr),
      paymentStatus: toStringValue(item.payment_status) as
        | "Paid"
        | "Pending"
        | "Overdue"
        | "Partially Paid",
      lastPaymentDate: toStringValue(item.last_payment_date),
      nextInvoiceDate: toStringValue(item.next_invoice_date),
      paymentMethod: toStringValue(item.payment_method) as
        | "UPI"
        | "Cash"
        | "Bank Transfer"
        | "Card",
      outstandingAmountInr: toNumberValue(item.outstanding_amount_inr),
    };
  });

  const invoices = getRows("invoices").map((row) => {
    const item = normalizeKeys(row);

    return {
      id: toStringValue(item.id),
      membershipId: toStringValue(item.membership_id),
      memberId: toStringValue(item.member_id),
      invoiceNumber: toStringValue(item.invoice_number),
      issuedOn: toStringValue(item.issued_on),
      dueOn: toStringValue(item.due_on),
      amountInr: toNumberValue(item.amount_inr),
      status: toStringValue(item.status) as
        | "Paid"
        | "Pending"
        | "Overdue"
        | "Partially Paid",
      paidOn: toStringValue(item.paid_on),
      paymentMethod: toStringValue(item.payment_method) as
        | "UPI"
        | "Cash"
        | "Bank Transfer"
        | "Card",
    };
  });

  const exercises = getRows("exercises").map((row) => {
    const item = normalizeKeys(row);

    return {
      id: toStringValue(item.id),
      name: toStringValue(item.name),
      category: toStringValue(item.category),
      difficulty: toStringValue(item.difficulty) as
        | "Beginner"
        | "Intermediate"
        | "Advanced",
      primaryMuscle: toStringValue(item.primary_muscle),
      equipment: toStringValue(item.equipment),
      mediaType: toStringValue(item.media_type) as "image" | "video",
      mediaUrl: toStringValue(item.media_url),
      cues: toArrayValue(item.cues),
    };
  });

  const workoutPlans = getRows("workout_plans").map((row) => {
    const item = normalizeKeys(row);

    return {
      id: toStringValue(item.id),
      name: toStringValue(item.name),
      goal: toStringValue(item.goal),
      coach: toStringValue(item.coach),
      split: toStringValue(item.split),
      durationWeeks: toNumberValue(item.duration_weeks),
      exercises: [],
    };
  });

  const planExerciseRows = getRows("workout_plan_exercises").map((row) => {
    const item = normalizeKeys(row);

    return {
      id: toStringValue(item.id),
      workoutPlanId: toStringValue(item.workout_plan_id),
      exerciseId: toStringValue(item.exercise_id),
      sets: toNumberValue(item.sets),
      reps: toStringValue(item.reps),
      restSeconds: toNumberValue(item.rest_seconds),
      notes: toStringValue(item.notes),
    };
  });

  const assignments = getRows("member_workout_assignments").map((row) => {
    const item = normalizeKeys(row);

    return {
      id: toStringValue(item.id),
      planId: toStringValue(item.plan_id),
      memberId: toStringValue(item.member_id),
      startDate: toStringValue(item.start_date),
      status: toStringValue(item.status) as "Active" | "Paused" | "Completed",
    };
  });

  const workoutLogs = getRows("workout_logs").map((row) => {
    const item = normalizeKeys(row);

    return {
      id: toStringValue(item.id),
      memberId: toStringValue(item.member_id),
      exerciseId: toStringValue(item.exercise_id),
      date: toStringValue(item.date),
      setsCompleted: toNumberValue(item.sets_completed),
      repsCompleted: toStringValue(item.reps_completed),
      weightKg: toNumberValue(item.weight_kg),
      notes: toStringValue(item.notes),
    };
  });

  const sessions = getRows("classes_or_sessions").map((row) => {
    const item = normalizeKeys(row);

    return {
      id: toStringValue(item.id),
      title: toStringValue(item.title),
      coach: toStringValue(item.coach),
      day: toStringValue(item.day),
      time: toStringValue(item.time),
      capacity: toNumberValue(item.capacity),
      room: toStringValue(item.room),
    };
  });

  const attendance = getRows("attendance").map((row) => {
    const item = normalizeKeys(row);

    return {
      id: toStringValue(item.id),
      sessionId: toStringValue(item.session_id),
      memberId: toStringValue(item.member_id),
      status: toStringValue(item.status) as "Booked" | "Checked In" | "Missed",
    };
  });

  const planExerciseMap = new Map(
    workoutPlans.map((plan) => [
      plan.id,
      planExerciseRows
        .filter((item) => item.workoutPlanId === plan.id)
        .map((item) => ({
          id: item.id,
          exerciseId: item.exerciseId,
          sets: item.sets,
          reps: item.reps,
          restSeconds: item.restSeconds,
          notes: item.notes,
        })),
    ]),
  );

  const data: AppData = {
    profiles,
    userPermissions: [],
    gymBranches: [],
    branchVisits: [],
    memberships,
    invoices,
    inventoryItems: [],
    inventorySales: [],
    exercises,
    workoutPlans: workoutPlans.map((plan) => ({
      ...plan,
      exercises: planExerciseMap.get(plan.id) ?? [],
    })),
    assignments,
    workoutLogs,
    progressCheckIns: [],
    progressPhotos: [],
    sessions,
    attendance,
  };

  const summary: ImportSummary[] = workbookSheetOrder.map((sheet) => ({
    sheet,
    rows: getRows(sheet).length,
  }));

  return {
    data,
    summary,
  };
}
