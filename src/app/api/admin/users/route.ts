import { createManagedUser, requireRole } from "@/lib/auth";
import { getAppData } from "@/lib/data";

export async function GET() {
  await requireRole("admin");
  const data = await getAppData();

  return Response.json({
    users: data.profiles,
  });
}

export async function POST(request: Request) {
  await requireRole("admin");

  const body = (await request.json()) as {
    fullName?: string;
    email?: string;
    password?: string;
    role?: "member" | "trainer" | "admin";
    phone?: string;
    fitnessGoal?: string;
    branch?: string;
  };

  if (!body.fullName?.trim() || !body.email?.trim() || !body.password?.trim() || !body.role) {
    return Response.json(
      { error: "Full name, email, password, and role are required." },
      { status: 400 },
    );
  }

  try {
    const user = await createManagedUser({
      fullName: body.fullName.trim(),
      email: body.email.trim(),
      password: body.password,
      role: body.role,
      phone: body.phone?.trim(),
      fitnessGoal: body.fitnessGoal?.trim(),
      branch: body.branch?.trim(),
    });

    return Response.json({
      message: "User created successfully.",
      user,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "User creation failed." },
      { status: 400 },
    );
  }
}
