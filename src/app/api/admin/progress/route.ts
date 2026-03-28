import {
  createProgressCheckIn,
  updateProgressCheckIn,
} from "@/lib/app-data-store";

function parseNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function validateBody(body: Record<string, unknown>) {
  if (!String(body.memberId ?? "").trim()) {
    return "Member is required.";
  }

  if (!String(body.recordedOn ?? "").trim()) {
    return "Recorded date is required.";
  }

  return null;
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const validationError = validateBody(body);

  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  const entry = await createProgressCheckIn({
    memberId: String(body.memberId),
    recordedOn: String(body.recordedOn),
    weightKg: parseNumber(body.weightKg),
    waistCm: parseNumber(body.waistCm),
    hipsCm: parseNumber(body.hipsCm),
    chestCm: parseNumber(body.chestCm),
    thighCm: parseNumber(body.thighCm),
    coachNote: String(body.coachNote ?? ""),
    energyLevel:
      String(body.energyLevel ?? "Medium") as "Low" | "Medium" | "High",
  });

  return Response.json({
    message: "Progress entry added successfully.",
    entry,
  });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;

  if (!String(body.id ?? "").trim()) {
    return Response.json({ error: "Entry id is required." }, { status: 400 });
  }

  const validationError = validateBody(body);

  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  try {
    const entry = await updateProgressCheckIn(String(body.id), {
      memberId: String(body.memberId),
      recordedOn: String(body.recordedOn),
      weightKg: parseNumber(body.weightKg),
      waistCm: parseNumber(body.waistCm),
      hipsCm: parseNumber(body.hipsCm),
      chestCm: parseNumber(body.chestCm),
      thighCm: parseNumber(body.thighCm),
      coachNote: String(body.coachNote ?? ""),
      energyLevel:
        String(body.energyLevel ?? "Medium") as "Low" | "Medium" | "High",
    });

    return Response.json({
      message: "Progress entry updated successfully.",
      entry,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Progress entry update failed.",
      },
      { status: 400 },
    );
  }
}
