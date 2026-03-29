import { requireRole } from "@/lib/auth";
import { createExercise, editExercise } from "@/lib/app-data-store";

function normalizeDifficulty(value: string) {
  return ["Beginner", "Intermediate", "Advanced"].includes(value)
    ? (value as "Beginner" | "Intermediate" | "Advanced")
    : "Beginner";
}

function normalizeMediaType(value: string) {
  return value === "image" ? "image" : "video";
}

export async function POST(request: Request) {
  await requireRole("admin");

  const body = (await request.json()) as {
    name?: string;
    category?: string;
    difficulty?: string;
    primaryMuscle?: string;
    equipment?: string;
    mediaType?: string;
    mediaUrl?: string;
    cues?: string[];
  };

  if (!body.name?.trim() || !body.mediaUrl?.trim()) {
    return Response.json({ error: "Exercise name and media link are required." }, { status: 400 });
  }

  const exercise = await createExercise({
    name: body.name.trim(),
    category: body.category?.trim() ?? "General",
    difficulty: normalizeDifficulty(body.difficulty ?? "Beginner"),
    primaryMuscle: body.primaryMuscle?.trim() ?? "",
    equipment: body.equipment?.trim() ?? "",
    mediaType: normalizeMediaType(body.mediaType ?? "video"),
    mediaUrl: body.mediaUrl.trim(),
    cues: (body.cues ?? []).map((cue) => cue.trim()).filter(Boolean),
  });

  return Response.json({ message: "Exercise created successfully.", exercise });
}

export async function PUT(request: Request) {
  await requireRole("admin");

  const body = (await request.json()) as {
    id?: string;
    name?: string;
    category?: string;
    difficulty?: string;
    primaryMuscle?: string;
    equipment?: string;
    mediaType?: string;
    mediaUrl?: string;
    cues?: string[];
  };

  if (!body.id?.trim() || !body.name?.trim() || !body.mediaUrl?.trim()) {
    return Response.json({ error: "Exercise id, name, and media link are required." }, { status: 400 });
  }

  try {
    const exercise = await editExercise(body.id, {
      name: body.name.trim(),
      category: body.category?.trim() ?? "General",
      difficulty: normalizeDifficulty(body.difficulty ?? "Beginner"),
      primaryMuscle: body.primaryMuscle?.trim() ?? "",
      equipment: body.equipment?.trim() ?? "",
      mediaType: normalizeMediaType(body.mediaType ?? "video"),
      mediaUrl: body.mediaUrl.trim(),
      cues: (body.cues ?? []).map((cue) => cue.trim()).filter(Boolean),
    });

    return Response.json({ message: "Exercise updated successfully.", exercise });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Exercise update failed." },
      { status: 400 },
    );
  }
}
