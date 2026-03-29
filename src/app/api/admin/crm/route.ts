import {
  createLeadRecord,
  deleteLeadRecord,
  updateLeadRecord,
} from "@/lib/business-data-store";
import { LeadSource, LeadStatus } from "@/lib/business-data";

function normalizeSource(value: string) {
  const allowed: LeadSource[] = ["WhatsApp", "Instagram", "Referral", "Walk-in", "Website"];
  return allowed.includes(value as LeadSource) ? (value as LeadSource) : "Website";
}

function normalizeStatus(value: string) {
  const allowed: LeadStatus[] = ["New", "Contacted", "Trial Booked", "Converted", "Lost"];
  return allowed.includes(value as LeadStatus) ? (value as LeadStatus) : "New";
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    fullName?: string;
    phone?: string;
    goal?: string;
    source?: string;
    status?: string;
    assignedTo?: string;
    nextFollowUp?: string;
    note?: string;
  };

  if (!body.fullName?.trim() || !body.phone?.trim()) {
    return Response.json({ error: "Lead name and phone are required." }, { status: 400 });
  }

  const lead = await createLeadRecord({
    fullName: body.fullName.trim(),
    phone: body.phone.trim(),
    goal: body.goal?.trim() ?? "",
    source: normalizeSource(body.source?.trim() ?? "Website"),
    status: normalizeStatus(body.status?.trim() ?? "New"),
    assignedTo: body.assignedTo?.trim() ?? "",
    nextFollowUp: body.nextFollowUp?.trim() ?? new Date().toISOString().slice(0, 10),
    note: body.note?.trim() ?? "",
  });

  return Response.json({ message: "Lead created successfully.", lead });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as {
    id?: string;
    fullName?: string;
    phone?: string;
    goal?: string;
    source?: string;
    status?: string;
    assignedTo?: string;
    nextFollowUp?: string;
    note?: string;
  };

  if (!body.id?.trim() || !body.fullName?.trim() || !body.phone?.trim()) {
    return Response.json({ error: "Lead id, name, and phone are required." }, { status: 400 });
  }

  try {
    const lead = await updateLeadRecord(body.id, {
      fullName: body.fullName.trim(),
      phone: body.phone.trim(),
      goal: body.goal?.trim() ?? "",
      source: normalizeSource(body.source?.trim() ?? "Website"),
      status: normalizeStatus(body.status?.trim() ?? "New"),
      assignedTo: body.assignedTo?.trim() ?? "",
      nextFollowUp: body.nextFollowUp?.trim() ?? new Date().toISOString().slice(0, 10),
      note: body.note?.trim() ?? "",
    });

    return Response.json({ message: "Lead updated successfully.", lead });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Lead update failed." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const body = (await request.json()) as { id?: string };

  if (!body.id?.trim()) {
    return Response.json({ error: "Lead id is required." }, { status: 400 });
  }

  await deleteLeadRecord(body.id);
  return Response.json({ message: "Lead deleted successfully.", id: body.id });
}
