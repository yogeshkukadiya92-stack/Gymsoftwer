import {
  createCustomCampaign,
  deleteCustomCampaign,
  updateCustomCampaign,
} from "@/lib/business-data-store";

type RecipientInput = {
  id?: string;
  name?: string;
  phone?: string;
  note?: string;
};

function normalizeRecipients(recipients: RecipientInput[] | undefined) {
  return (recipients ?? [])
    .map((recipient, index) => ({
      id: recipient.id?.trim() || `recipient-${index + 1}`,
      name: recipient.name?.trim() ?? "",
      phone: recipient.phone?.trim() ?? "",
      note: recipient.note?.trim() ?? "",
    }))
    .filter((recipient) => recipient.name && recipient.phone);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    title?: string;
    scheduledFor?: string;
    message?: string;
    recipients?: RecipientInput[];
  };

  if (!body.title?.trim() || !body.message?.trim()) {
    return Response.json({ error: "Campaign title and message are required." }, { status: 400 });
  }

  const campaign = await createCustomCampaign({
    title: body.title.trim(),
    scheduledFor: body.scheduledFor?.trim() ?? "Any time",
    message: body.message.trim(),
    recipients: normalizeRecipients(body.recipients),
  });

  return Response.json({ message: "Campaign created successfully.", campaign });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as {
    id?: string;
    title?: string;
    scheduledFor?: string;
    message?: string;
    recipients?: RecipientInput[];
  };

  if (!body.id?.trim() || !body.title?.trim() || !body.message?.trim()) {
    return Response.json(
      { error: "Campaign id, title, and message are required." },
      { status: 400 },
    );
  }

  try {
    const campaign = await updateCustomCampaign(body.id, {
      title: body.title.trim(),
      scheduledFor: body.scheduledFor?.trim() ?? "Any time",
      message: body.message.trim(),
      recipients: normalizeRecipients(body.recipients),
    });

    return Response.json({ message: "Campaign updated successfully.", campaign });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Campaign update failed." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const body = (await request.json()) as { id?: string };

  if (!body.id?.trim()) {
    return Response.json({ error: "Campaign id is required." }, { status: 400 });
  }

  await deleteCustomCampaign(body.id);
  return Response.json({ message: "Campaign deleted successfully.", id: body.id });
}
