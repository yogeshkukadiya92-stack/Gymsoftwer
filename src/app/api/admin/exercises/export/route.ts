import { requireRole } from "@/lib/auth";
import { getAppData } from "@/lib/data";
import { buildExercisesWorkbook, workbookToBuffer } from "@/lib/excel";

export async function GET(request: Request) {
  await requireRole("admin");

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim().toLowerCase() ?? "";
  const category = searchParams.get("category")?.trim() ?? "All categories";
  const difficulty = searchParams.get("difficulty")?.trim() ?? "All difficulties";
  const mediaType = searchParams.get("mediaType")?.trim() ?? "All media";
  const sort = searchParams.get("sort")?.trim() ?? "name";

  const data = await getAppData();
  const exercises = data.exercises
    .filter((exercise) => {
      const matchesSearch =
        !search ||
        [
          exercise.name,
          exercise.category,
          exercise.primaryMuscle,
          exercise.equipment,
          exercise.cues.join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(search);
      const matchesCategory = category === "All categories" || exercise.category === category;
      const matchesDifficulty =
        difficulty === "All difficulties" || exercise.difficulty === difficulty;
      const matchesMedia = mediaType === "All media" || exercise.mediaType === mediaType;

      return matchesSearch && matchesCategory && matchesDifficulty && matchesMedia;
    })
    .sort((a, b) => {
      switch (sort) {
        case "category":
          return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
        case "difficulty":
          return a.difficulty.localeCompare(b.difficulty) || a.name.localeCompare(b.name);
        case "muscle":
          return a.primaryMuscle.localeCompare(b.primaryMuscle) || a.name.localeCompare(b.name);
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const workbook = buildExercisesWorkbook(exercises);

  return new Response(workbookToBuffer(workbook), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="gymflow-exercises.xlsx"',
    },
  });
}
