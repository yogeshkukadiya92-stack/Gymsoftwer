import { createManagedUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    fullName?: string;
    email?: string;
    password?: string;
    phone?: string;
    fitnessGoal?: string;
    branch?: string;
  };

  if (!body.fullName?.trim() || !body.email?.trim() || !body.password?.trim()) {
    return Response.json(
      { error: "Full name, email, and password are required." },
      { status: 400 },
    );
  }

  if (!hasSupabaseEnv) {
    return Response.json(
      { error: "Sign-up requires Supabase configuration." },
      { status: 400 },
    );
  }

  try {
    await createManagedUser({
      fullName: body.fullName.trim(),
      email: body.email.trim(),
      password: body.password,
      role: "member",
      phone: body.phone?.trim(),
      fitnessGoal: body.fitnessGoal?.trim(),
      branch: body.branch?.trim(),
    });

    return Response.json({
      message: "Account created successfully. Please sign in.",
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Sign-up failed." },
      { status: 400 },
    );
  }
}
