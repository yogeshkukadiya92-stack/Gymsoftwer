import {
  createDietPlan,
  deleteDietPlan,
  updateDietPlan,
} from "@/lib/business-data-store";

type MealInput = {
  title?: string;
  items?: string[];
};

function normalizeMeals(meals: MealInput[] | undefined) {
  return (meals ?? [])
    .map((meal) => ({
      title: meal.title?.trim() ?? "",
      items: (meal.items ?? []).map((item) => item.trim()).filter(Boolean),
    }))
    .filter((meal) => meal.title && meal.items.length > 0);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    memberId?: string;
    memberName?: string;
    coach?: string;
    goal?: string;
    calories?: number;
    proteinGrams?: number;
    adherence?: number;
    updatedOn?: string;
    meals?: MealInput[];
  };

  if (!body.memberName?.trim() || !body.goal?.trim()) {
    return Response.json(
      { error: "Member name and goal are required." },
      { status: 400 },
    );
  }

  const plan = await createDietPlan({
    memberId: body.memberId?.trim() || undefined,
    memberName: body.memberName.trim(),
    coach: body.coach?.trim() ?? "",
    goal: body.goal.trim(),
    calories: Number(body.calories ?? 0),
    proteinGrams: Number(body.proteinGrams ?? 0),
    adherence: Number(body.adherence ?? 0),
    updatedOn: body.updatedOn?.trim() ?? new Date().toISOString().slice(0, 10),
    meals: normalizeMeals(body.meals),
  });

  return Response.json({ message: "Diet plan created successfully.", plan });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as {
    id?: string;
    memberId?: string;
    memberName?: string;
    coach?: string;
    goal?: string;
    calories?: number;
    proteinGrams?: number;
    adherence?: number;
    updatedOn?: string;
    meals?: MealInput[];
  };

  if (!body.id?.trim() || !body.memberName?.trim() || !body.goal?.trim()) {
    return Response.json(
      { error: "Plan id, member name, and goal are required." },
      { status: 400 },
    );
  }

  try {
    const plan = await updateDietPlan(body.id, {
      memberId: body.memberId?.trim() || undefined,
      memberName: body.memberName.trim(),
      coach: body.coach?.trim() ?? "",
      goal: body.goal.trim(),
      calories: Number(body.calories ?? 0),
      proteinGrams: Number(body.proteinGrams ?? 0),
      adherence: Number(body.adherence ?? 0),
      updatedOn: body.updatedOn?.trim() ?? new Date().toISOString().slice(0, 10),
      meals: normalizeMeals(body.meals),
    });

    return Response.json({ message: "Diet plan updated successfully.", plan });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Diet plan update failed." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const body = (await request.json()) as { id?: string };

  if (!body.id?.trim()) {
    return Response.json({ error: "Plan id is required." }, { status: 400 });
  }

  await deleteDietPlan(body.id);
  return Response.json({ message: "Diet plan deleted successfully.", id: body.id });
}
