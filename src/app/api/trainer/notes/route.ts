import {
  createTrainerNote,
  deleteTrainerNote,
  updateTrainerNote,
} from "@/lib/business-data-store";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    memberId?: string;
    memberName?: string;
    trainerName?: string;
    note?: string;
    focusArea?: string;
    updatedOn?: string;
  };

  if (!body.memberId?.trim() || !body.memberName?.trim() || !body.note?.trim()) {
    return Response.json(
      { error: "Member, member name, and note are required." },
      { status: 400 },
    );
  }

  const note = await createTrainerNote({
    memberId: body.memberId.trim(),
    memberName: body.memberName.trim(),
    trainerName: body.trainerName?.trim() ?? "",
    note: body.note.trim(),
    focusArea: body.focusArea?.trim() ?? "",
    updatedOn: body.updatedOn?.trim() ?? new Date().toISOString().slice(0, 10),
  });

  return Response.json({ message: "Trainer note created successfully.", note });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as {
    id?: string;
    memberId?: string;
    memberName?: string;
    trainerName?: string;
    note?: string;
    focusArea?: string;
    updatedOn?: string;
  };

  if (!body.id?.trim() || !body.memberId?.trim() || !body.memberName?.trim() || !body.note?.trim()) {
    return Response.json(
      { error: "Note id, member, member name, and note are required." },
      { status: 400 },
    );
  }

  try {
    const note = await updateTrainerNote(body.id, {
      memberId: body.memberId.trim(),
      memberName: body.memberName.trim(),
      trainerName: body.trainerName?.trim() ?? "",
      note: body.note.trim(),
      focusArea: body.focusArea?.trim() ?? "",
      updatedOn: body.updatedOn?.trim() ?? new Date().toISOString().slice(0, 10),
    });

    return Response.json({ message: "Trainer note updated successfully.", note });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Trainer note update failed." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const body = (await request.json()) as { id?: string };

  if (!body.id?.trim()) {
    return Response.json({ error: "Note id is required." }, { status: 400 });
  }

  await deleteTrainerNote(body.id);
  return Response.json({ message: "Trainer note deleted successfully.", id: body.id });
}
